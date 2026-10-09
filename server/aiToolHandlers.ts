import { getDb, isTimeOverlapping } from './db.ts';
import { supabaseAdmin } from './supabase.ts';

export async function executeAiTool(name: string, args: any) {
  try {
    switch (name) {
      case 'getAvailableBranches': {
        try {
          if (!supabaseAdmin) throw new Error('Supabase not configured');
          const { data, error } = await supabaseAdmin
            .from('branches')
            .select('code, name, city, address, contact_number')
            .eq('status', 'ACTIVE');
          if (!error && data && data.length > 0) {
            return { branches: data };
          }
        } catch {
          // fallback to local db
        }
        const db = getDb();
        const localBranches = db.branches
          .filter(b => b.status === 'ACTIVE')
          .map(b => ({
            code: b.code,
            name: b.name,
            city: b.city,
            address: b.address,
            contact_number: b.contactNumber
          }));
        return { branches: localBranches };
      }

      case 'getCourseSlots': {
        const courseCodeStr = (args.courseCode || '').toUpperCase().trim();
        try {
          if (!supabaseAdmin) throw new Error('Supabase not configured');
          const { data: course, error: courseError } = await supabaseAdmin
            .from('courses')
            .select('id, course_code, title')
            .eq('course_code', courseCodeStr)
            .single();

          if (!courseError && course) {
            const { data: slots, error: slotsError } = await supabaseAdmin
              .from('exam_slots')
              .select('id, exam_date, start_time, end_time, capacity')
              .eq('course_id', course.id);

            if (!slotsError && slots) {
              return { course: course.title, courseCode: course.course_code, slots };
            }
          }
        } catch {
          // fallback to local DB on error
        }
        const db = getDb();
        const localCourse = db.courses.find(c => c.code.toUpperCase() === courseCodeStr);
        if (!localCourse) {
          return { error: `Course with code ${args.courseCode} not found in database.` };
        }
        const localSlots = db.slots
          .filter(s => s.courseId === localCourse.id || s.courseCode === localCourse.code)
          .map(s => ({
            id: s.id,
            exam_date: s.examDate,
            start_time: s.startTime,
            end_time: s.endTime,
            capacity: s.capacity
          }));
        return { course: localCourse.title, courseCode: localCourse.code, slots: localSlots };
      }

      case 'checkSlotSeats': {
        const slotIdStr = args.slotId;
        try {
          if (!supabaseAdmin) throw new Error('Supabase not configured');
          const { data: slot, error: slotError } = await supabaseAdmin
            .from('exam_slots')
            .select('id, capacity')
            .eq('id', slotIdStr)
            .single();

          if (!slotError && slot) {
            const { count, error: countError } = await supabaseAdmin
              .from('student_slot_selections')
              .select('*', { count: 'exact', head: true })
              .eq('slot_id', slotIdStr);

            if (!countError && typeof count === 'number') {
              const cap = slot.capacity || 50;
              return {
                slotId: slotIdStr,
                totalCapacity: cap,
                bookedSeats: count,
                remainingSeats: Math.max(0, cap - count)
              };
            }
          }
        } catch {
          // fallback to local DB on error
        }
        const db = getDb();
        const localSlot = db.slots.find(s => s.id === slotIdStr);
        if (!localSlot) {
          return { error: `Exam slot with ID '${slotIdStr}' not found in database.` };
        }
        const bookedCount = db.selections.filter(sel => sel.slotId === slotIdStr).length;
        const totalCap = localSlot.capacity;
        return {
          slotId: slotIdStr,
          totalCapacity: totalCap,
          bookedSeats: bookedCount,
          remainingSeats: Math.max(0, totalCap - bookedCount)
        };
      }

      case 'getMyAssignedCourses': {
        const studentIdStr = args.studentId;
        const db = getDb();
        const localStudent = db.students.find(s => s.id === studentIdStr || s.userId === studentIdStr);

        if (localStudent) {
          const assignedCourses = db.courses.filter(c => localStudent.assignedCourseIds.includes(c.id));
          const count = assignedCourses.length;
          const meetsRule = count >= 4 && count <= 6;
          return {
            studentName: localStudent.fullName,
            regNumber: localStudent.regNumber,
            program: localStudent.program,
            assignedCoursesCount: count,
            meetsRule,
            ruleMessage: meetsRule
              ? `Valid assignment (${count} courses assigned). Requirements met.`
              : `Assignment Incomplete (${count} courses). Students must be assigned between 4 and 6 courses.`,
            assignedCourses: assignedCourses.map(c => ({ code: c.code, title: c.title, creditHours: c.creditHours }))
          };
        }

        return { error: 'Student record not found.' };
      }

      case 'checkScheduleConflicts': {
        const studentIdStr = args.studentId;
        const db = getDb();
        const studentSelections = db.selections.filter(sel => sel.studentId === studentIdStr);
        if (studentSelections.length === 0) {
          return { hasConflict: false, message: 'No slot selections saved yet for conflict check.' };
        }

        const selectedSlots = studentSelections.map(sel => db.slots.find(s => s.id === sel.slotId)).filter(Boolean);

        let conflicts = [];
        for (let i = 0; i < selectedSlots.length; i++) {
          for (let j = i + 1; j < selectedSlots.length; j++) {
            const s1 = selectedSlots[i]!;
            const s2 = selectedSlots[j]!;
            if (s1.examDate === s2.examDate && isTimeOverlapping(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
              conflicts.push({
                courseA: s1.courseCode,
                courseB: s2.courseCode,
                date: s1.examDate,
                timeA: `${s1.startTime}-${s1.endTime}`,
                timeB: `${s2.startTime}-${s2.endTime}`
              });
            }
          }
        }

        return {
          hasConflict: conflicts.length > 0,
          conflictCount: conflicts.length,
          conflicts
        };
      }

      default:
        return { error: `Unknown tool function: ${name}` };
    }
  } catch (err: any) {
    return { error: err.message || 'Error executing database tool query' };
  }
}
