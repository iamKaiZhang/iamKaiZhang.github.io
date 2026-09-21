// src/components/Research/types.ts

export interface PaperLink {
  link: string;
  text?: string;
}

export interface PaperData<Tag extends string = string> {
  title: string;
  authors: string;
  tags: Tag[];
  journal?: string;
  year?: number;
  remark?: string;
  status?: string;
  links?: PaperLink[];
}
