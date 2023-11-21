export interface PostMetadata {
  ctime?: number;
  mtime?: number;
  title: string;
  author?: string;
  tags?: string[];
  toc?: TableOfContents[];
}

export interface Post {
  metadata: PostMetadata;
  html: string;
}

export interface TableOfContents {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  id: string;
  title: string;
}
