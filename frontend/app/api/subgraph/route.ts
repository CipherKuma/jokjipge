import { NextRequest, NextResponse } from 'next/server'
import { getSubgraphEndpoint, hasSubgraph } from '@/constants/subgraphs'

const CHAIN_ID = 4613 // VeryChain Mainnet

// Get subgraph URL using the centralized config
function getSubgraphUrl(): string {
  if (!hasSubgraph(CHAIN_ID, 'predictionmarket')) {
    throw new Error('Subgraph not configured for VeryChain')
  }
  return getSubgraphEndpoint(CHAIN_ID, 'predictionmarket')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, variables } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const subgraphUrl = getSubgraphUrl()

    const response = await fetch(subgraphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    })

    if (!response.ok) {
      console.error('Subgraph request failed:', response.status, response.statusText)
      return NextResponse.json(
        { error: `Subgraph request failed: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error('Subgraph API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
