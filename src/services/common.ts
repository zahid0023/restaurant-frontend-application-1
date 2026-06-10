export interface MutationResponse {
  success: boolean;
  id: number;
}

export interface PageResponse<T> {
  data: T[];
  current_page: number;
  total_pages: number;
  total_elements: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListParams {
  page?: number;
  size?: number;
  sort_by?: string;
  sort_dir?: "ASC" | "DESC";
  query?: string;
}
