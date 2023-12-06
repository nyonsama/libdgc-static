export interface PostMetadata {
  createDate: string;
  modifyDate?: string;
  title: string;
  author?: string;
  tags?: string[];
  toc?: TocEntry[];
}

export interface Post {
  metadata: PostMetadata;
  html: string;
}

export interface TocEntry {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  content: string;
}
