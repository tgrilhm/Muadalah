/** Standard API response wrapper */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

/** Standard API error response */
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
}

/** Field-level validation error */
export interface FieldError {
  field: string;
  message: string;
  code: string;
}

/** Pagination metadata */
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

/** Pagination query parameters */
export interface PaginationParams {
  page?: number;
  perPage?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
