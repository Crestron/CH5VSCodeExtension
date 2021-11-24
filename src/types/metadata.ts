/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Metadata {
  version: string;
  htmlElements: ElementsData;
  ch5Elements: ElementsData;
}
export interface ElementsData {
  common: CommonData;
  elements?: Ch5Element[];
}
export interface CommonData {
  exclude?: string[];
  attributes: Ch5Attribute[];
}
export interface Ch5Attribute {
  name: string;
  value?: string[];
  documentation?: string[];
  childElements?: ChildElements[];
  default?: string;
  deprecated?: Deprecated;
}
export interface ChildElements {
  tagName?: string;
  optional?: boolean;
  childElements?: ChildElements[];
}
export interface Ch5Element {
  name: string;
  tagName: string;
  description?: string;
  attributes?: Ch5Attribute[];
  documentation?: string[];
  snippets?: Ch5Snippet[];
  childElements?: ChildElements[];
  default?: string;
  role?: string;
  componentVersion?: string;
}
export interface Ch5Snippet {
  prefix: string;
  description: string;
  body: string[];
}
export interface ChildElements {
  tagName?: string;
  optional?: boolean;
  childElements?: ChildElements[];
}

export interface Deprecated {
  version: string;
  description: string;
}
