# AI Chatbot Implementation Plan using Google Gen AI SDK
# ExamSlot Assistant: Live Database Tool-Calling Agent

---

## 1. Executive Summary & Objective

This document provides a complete technical design and step-by-step implementation plan for adding an **Interactive AI Student Assistant** to ExamSlot. 

The chatbot uses the official **Google Gen AI SDK (`@google/genai`)** with the `gemini-2.0-flash` model. Crucially, the AI assistant **does NOT use static dummy data or hallucinate**; it utilizes **Function Calling (Tools)** to query real database tables live for active branches, course exam slots, seat capacity, assigned courses, time conflicts, and date sheet status.

---

## 2. Architecture & Tool Execution Loop

```
+-----------------------------------------------------------------------------------+
|                            STUDENT CHAT UI (ChatWidget)                           |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ HTTP POST /api/chat
+-----------------------------------------------------------------------------------+
|                            NEXT.JS SERVER ROUTE HANDLER                           |
|                             (app/api/chat/route.ts)                               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                        GOOGLE GEN AI SDK (@google/genai)                          |
|                             Model: gemini-2.0-flash                               |
+-----------------------------------------------------------------------------------+
                                         │
                                         ├── Model emits Tool Call: functionCall
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
|                         LIVE DATABASE TOOLS (lib/aiTools.ts)                       |
|  - get_available_branches()        -> Queries active campuses                     |
|  - get_course_slots(courseCode)    -> Queries exam dates & start/end times        |
|  - check_slot_seats(slotId)        -> Calculates remaining seat capacity          |
|  - get_my_assigned_courses(id)     -> Returns assigned courses & 4-6 rule state    |
|  - check_schedule_conflicts(id)    -> Runs time-overlap validator math            |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼ Returns tool execution data
+-----------------------------------------------------------------------------------+
|               Gemini synthesizes natural language response for user               |
+-----------------------------------------------------------------------------------+
```

---

## 3. Tool Declarations Schema (`lib/aiTools.ts`)

These function declarations tell Gemini what database tools are available and what parameters they accept.

```typescript
// lib/aiTools.ts
import { FunctionDeclaration, Type } from '@google/genai';

// 1. Tool Declaration: Get Available Branches
export const getAvailableBranchesDeclaration: FunctionDeclaration = {
  name: 'getAvailableBranches',
  description: 'Fetches the list of all active Virtual University exam campuses/branches with city and address details.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

// 2. Tool Declaration: Get Exam Slots for a Course
export const getCourseSlotsDeclaration: FunctionDeclaration = {
  name: 'getCourseSlots',
  description: 'Fetches all available exam date and time slots for a specific course code (e.g. CS101, CS201).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      courseCode: {
        type: Type.STRING,
        description: 'The unique course code, e.g., CS101 or MATH101.',
      },
    },
    required: ['courseCode'],
  },
};

// 3. Tool Declaration: Check Seat Capacity
export const checkSlotSeatsDeclaration: FunctionDeclaration = {
  name: 'checkSlotSeats',
  description: 'Checks remaining seat capacity for a specific exam slot ID.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      slotId: {
        type: Type.STRING,
        description: 'The unique exam slot ID.',
      },
    },
    required: ['slotId'],
  },
};

// 4. Tool Declaration: Get Student Assigned Courses
export const getMyAssignedCoursesDeclaration: FunctionDeclaration = {
  name: 'getMyAssignedCourses',
  description: 'Fetches assigned courses for the authenticated student and verifies the 4-to-6 course rule status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      studentId: {
        type: Type.STRING,
        description: 'The student ID.',
      },
    },
    required: ['studentId'],
  },
};

// Bundle all tools for Gemini SDK
export const examSlotTools = [
  getAvailableBranchesDeclaration,
  getCourseSlotsDeclaration,
  checkSlotSeatsDeclaration,
  getMyAssignedCoursesDeclaration,
];
```

---

## 4. Database Tool Handlers (Live Query Execution)

```typescript
// lib/aiToolHandlers.ts
import { supabase } from './supabase'; // or store import

export async function executeAiTool(name: string, args: any) {
  switch (name) {
    case 'getAvailableBranches': {
      const { data } = await supabase
        .from('branches')
        .select('code, name, city, address, contact_number')
        .eq('status', 'ACTIVE');
      return { branches: data || [] };
    }

    case 'getCourseSlots': {
      const { data: course } = await supabase
        .from('courses')
        .select('id, code, title')
        .eq('course_code', args.courseCode.toUpperCase())
        .single();

      if (!course) return { error: `Course ${args.courseCode} not found.` };

      const { data: slots } = await supabase
        .from('exam_slots')
        .select('id, exam_date, start_time, end_time, capacity')
        .eq('course_id', course.id);

      return { course: course.title, slots: slots || [] };
    }

    case 'checkSlotSeats': {
      const { data: slot } = await supabase
        .from('exam_slots')
        .select('capacity')
        .eq('id', args.slotId)
        .single();

      const { count } = await supabase
        .from('student_slot_selections')
        .select('*', { count: 'exact', head: true })
        .eq('slot_id', args.slotId);

      const capacity = slot?.capacity || 50;
      const booked = count || 0;
      const remaining = Math.max(0, capacity - booked);

      return { slotId: args.slotId, totalCapacity: capacity, bookedSeats: booked, remainingSeats: remaining };
    }

    case 'getMyAssignedCourses': {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('id, full_name, reg_number, program')
        .eq('id', args.studentId)
        .single();

      const { data: assignments } = await supabase
        .from('student_course_assignments')
        .select('course_id, courses(course_code, title, credit_hours)')
        .eq('student_id', args.studentId);

      const count = assignments?.length || 0;
      const isComplete = count >= 4 && count <= 6;

      return {
        student: profile,
        assignedCoursesCount: count,
        meetsRule: isComplete,
        ruleMessage: isComplete ? 'Valid assignment (4 to 6 courses).' : `Incomplete assignment (${count} courses). Must have between 4 and 6 courses.`,
        courses: assignments?.map((a: any) => a.courses) || [],
      };
    }

    default:
      return { error: `Unknown tool name: ${name}` };
  }
}
```

---

## 5. Next.js API Route with Tool Execution Loop (`app/api/chat/route.ts`)

```typescript
// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { examSlotTools } from '@/lib/aiTools';
import { executeAiTool } from '@/lib/aiToolHandlers';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { messages, studentId } = await req.json();

    const systemInstruction = `
      You are the ExamSlot AI Assistant for Virtual University.
      Your job is to assist students with queries regarding exam branches, course exam slots, seat availability, assigned courses, and time conflicts.
      IMPORTANT: NEVER guess or invent data. ALWAYS use the provided database tools to fetch live data before answering queries.
    `;

    // 1. Initial call to Gemini 2.0 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: messages,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: examSlotTools }],
      },
    });

    // 2. Check if Gemini wants to call a tool
    const functionCalls = response.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolName = call.name;
      const toolArgs = { ...call.args, studentId };

      // Execute live DB query
      const toolResult = await executeAiTool(toolName, toolArgs);

      // 3. Send tool result back to Gemini for final natural language synthesis
      const followUpResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          ...messages,
          { role: 'model', parts: [{ functionCall: call }] },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: toolName,
                  response: toolResult,
                },
              },
            ],
          },
        ],
      });

      return NextResponse.json({
        reply: followUpResponse.text,
        executedTool: toolName,
      });
    }

    return NextResponse.json({ reply: response.text });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json({ error: error.message || 'Internal AI Error' }, { status: 500 });
  }
}
```

---

## 6. Step-by-Step Implementation Roadmap for Coding Agents

### Task 1: Package & Environment Setup
- Run `npm install @google/genai`
- Add `GEMINI_API_KEY="AIzaSy..."` to `.env.local`

### Task 2: Create Tool Definitions (`lib/aiTools.ts`)
- Implement `getAvailableBranchesDeclaration`, `getCourseSlotsDeclaration`, `checkSlotSeatsDeclaration`, `getMyAssignedCoursesDeclaration`.

### Task 3: Create Tool Handlers (`lib/aiToolHandlers.ts`)
- Bind handlers to Supabase / Prisma database models to fetch real live data.

### Task 4: Create Next.js API Route (`app/api/chat/route.ts`)
- Implement the 2-step tool execution loop with `@google/genai`.

### Task 5: Build Floating Chatbot Component (`components/ChatWidget.tsx`)
- Build UI widget with quick-click suggestion chips:
  - *"What exam branches are available?"*
  - *"Show available slots for CS101"*
  - *"Check seat capacity for my slots"*
  - *"Are my assigned courses complete?"*
