export interface IKnowledgeBaseArticle {
  subject: string;
  slug: string;
  group_id: number;
  internal_article: number;
  disabled: number;
  s3_path?: string;
  article_description: string;
  group_name?: string;
  status: string;
}

export interface IGroups {
  status: string;
  group_name: string;
  id: string;
  orders: 0;
  short_description: string;
}
