import { parse, visit, type DocumentNode, type FragmentDefinitionNode } from 'graphql'

type GraphQLSecurityLimits = {
  maxComplexity: number
  maxDepth: number
  maxTopLevelSelections: number
}

type GraphQLSecurityResult =
  | { ok: true }
  | { message: string; ok: false }

export function getGraphQLSecurityLimits(): GraphQLSecurityLimits {
  const parsedDepth = Number(process.env.GRAPHQL_MAX_DEPTH || 8)
  const parsedComplexity = Number(process.env.GRAPHQL_MAX_COMPLEXITY || 250)
  const parsedTopLevelSelections = Number(process.env.GRAPHQL_MAX_TOP_LEVEL_SELECTIONS || 20)

  return {
    maxComplexity: Number.isFinite(parsedComplexity) && parsedComplexity > 0 ? parsedComplexity : 250,
    maxDepth: Number.isFinite(parsedDepth) && parsedDepth > 0 ? parsedDepth : 8,
    maxTopLevelSelections:
      Number.isFinite(parsedTopLevelSelections) && parsedTopLevelSelections > 0 ? parsedTopLevelSelections : 20,
  }
}

function buildFragmentMap(document: DocumentNode) {
  const map = new Map<string, FragmentDefinitionNode>()

  for (const definition of document.definitions) {
    if (definition.kind === 'FragmentDefinition') {
      map.set(definition.name.value, definition)
    }
  }

  return map
}

function calculateDepthAndComplexity(document: DocumentNode) {
  const fragmentMap = buildFragmentMap(document)
  let maxDepth = 0
  let complexity = 0
  let maxTopLevelSelections = 0

  const visitSelection = (selectionSet: any, depth: number) => {
    if (!selectionSet?.selections) {
      return
    }

    maxDepth = Math.max(maxDepth, depth)

    for (const selection of selectionSet.selections) {
      if (selection.kind === 'Field') {
        complexity += 1
        if (selection.selectionSet) {
          visitSelection(selection.selectionSet, depth + 1)
        }
      }

      if (selection.kind === 'InlineFragment') {
        visitSelection(selection.selectionSet, depth + 1)
      }

      if (selection.kind === 'FragmentSpread') {
        const fragment = fragmentMap.get(selection.name.value)
        if (fragment) {
          visitSelection(fragment.selectionSet, depth + 1)
        }
      }
    }
  }

  visit(document, {
    OperationDefinition(node) {
      maxTopLevelSelections = Math.max(maxTopLevelSelections, node.selectionSet.selections.length)
      visitSelection(node.selectionSet, 1)
    },
  })

  return {
    complexity,
    maxDepth,
    maxTopLevelSelections,
  }
}

export function validateGraphQLQuerySecurity(query: string): GraphQLSecurityResult {
  try {
    const document = parse(query)
    const { complexity, maxDepth, maxTopLevelSelections } = calculateDepthAndComplexity(document)
    const limits = getGraphQLSecurityLimits()

    if (maxDepth > limits.maxDepth) {
      return {
        message: `GraphQL query depth limit exceeded. Max depth is ${limits.maxDepth}.`,
        ok: false,
      }
    }

    if (complexity > limits.maxComplexity) {
      return {
        message: `GraphQL query complexity limit exceeded. Max complexity is ${limits.maxComplexity}.`,
        ok: false,
      }
    }

    if (maxTopLevelSelections > limits.maxTopLevelSelections) {
      return {
        message: `GraphQL top-level selection limit exceeded. Max selections is ${limits.maxTopLevelSelections}.`,
        ok: false,
      }
    }

    return { ok: true }
  } catch {
    return {
      message: 'Invalid GraphQL query payload.',
      ok: false,
    }
  }
}

