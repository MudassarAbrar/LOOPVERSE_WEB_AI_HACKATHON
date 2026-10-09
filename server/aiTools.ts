import { FunctionDeclaration, Type } from '@google/genai';

// 1. Tool Declaration: Get Available Branches
export const getAvailableBranchesDeclaration: FunctionDeclaration = {
  name: 'getAvailableBranches',
  description: 'Fetches the list of all active Virtual University exam campuses/branches with city, address, and contact details.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

// 2. Tool Declaration: Get Exam Slots for a Course
export const getCourseSlotsDeclaration: FunctionDeclaration = {
  name: 'getCourseSlots',
  description: 'Fetches all available exam dates, morning/afternoon start times, and end times for a specific course code (e.g. CS101, CS201, MTH101).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      courseCode: {
        type: Type.STRING,
        description: 'The unique course code, e.g., CS101, CS201, or MTH101.',
      },
    },
    required: ['courseCode'],
  },
};

// 3. Tool Declaration: Check Seat Capacity
export const checkSlotSeatsDeclaration: FunctionDeclaration = {
  name: 'checkSlotSeats',
  description: 'Checks total seat capacity, booked count, and remaining seats for an exam slot.',
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
  description: 'Fetches assigned courses for a student and verifies if the 4-to-6 course rule requirement is satisfied.',
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

// 5. Tool Declaration: Check Schedule Time Conflicts
export const checkScheduleConflictsDeclaration: FunctionDeclaration = {
  name: 'checkScheduleConflicts',
  description: 'Checks if any selected exam slots overlap on the same date and time.',
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

export const examSlotTools = [
  getAvailableBranchesDeclaration,
  getCourseSlotsDeclaration,
  checkSlotSeatsDeclaration,
  getMyAssignedCoursesDeclaration,
  checkScheduleConflictsDeclaration,
];
