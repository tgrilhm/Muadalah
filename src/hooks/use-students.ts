'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateStudentInput, UpdateStudentInput, StudentQueryInput } from '@/lib/validations/student.schema';

// Query keys
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (schoolId: string | undefined, filters: StudentQueryInput) => [...studentKeys.lists(), schoolId, filters] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};

// Fetch students list
async function fetchStudents(schoolId: string | undefined, params: StudentQueryInput) {
  const searchParams = new URLSearchParams();
  
  // Add schoolId as required parameter
  if (schoolId) {
    searchParams.append('schoolId', schoolId);
  }
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`/api/students?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch students');
  }
  return response.json();
}

// Fetch single student
async function fetchStudent(id: string) {
  const response = await fetch(`/api/students/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch student');
  }
  return response.json();
}

// Create student
async function createStudent(data: CreateStudentInput) {
  const response = await fetch('/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create student');
  }
  return response.json();
}

// Update student
async function updateStudent({ id, data }: { id: string; data: UpdateStudentInput }) {
  const response = await fetch(`/api/students/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update student');
  }
  return response.json();
}

// Delete student
async function deleteStudent(id: string) {
  const response = await fetch(`/api/students/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete student');
  }
  return response.json();
}

// Upload photo
async function uploadPhoto({ id, file }: { id: string; file: File }) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/students/${id}/photo`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload photo');
  }
  return response.json();
}

// Hooks
export function useStudents(schoolId: string | undefined, params: StudentQueryInput) {
  return useQuery({
    queryKey: studentKeys.list(schoolId, params),
    queryFn: () => fetchStudents(schoolId, params),
    enabled: !!schoolId, // Only fetch when school is selected
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => fetchStudent(id),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStudent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
}

export function useUploadStudentPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadPhoto,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
    },
  });
}
