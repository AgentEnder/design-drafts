import type { PageContextServer } from 'vike/types';
import type { BranchEntry } from '../+onCreateGlobalContext.server.js';

export type CompareData = {
  branches: BranchEntry[];
};

export function data(pageContext: PageContextServer): CompareData {
  return {
    branches: pageContext.globalContext.branches,
  };
}
