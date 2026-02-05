export interface PostMetadata {
  createDate: string;
  lastEditDate?: string;
  title: string;
  author?: string;
  tags?: string[];
  toc?: TocEntry[];
}

export interface Post {
  metadata: PostMetadata;
  path: string;
  html: string;
  abstract: string;
}

export interface TocEntry {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  content: string;
}
