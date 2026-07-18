import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_BACKEND_URL = 'http://localhost:5000'

function getBackendBaseUrl() {
  return process.env.BACKEND_URL?.trim() || process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || DEFAULT_BACKEND_URL
}

function buildTargetUrl(request: NextRequest, pathSegments: string[]) {
  const url = new URL(request.url)
  const pathname = pathSegments.length > 0 ? `/api/${pathSegments.join('/')}` : '/api'
  return new URL(`${pathname}${url.search}`, getBackendBaseUrl())
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const targetUrl = buildTargetUrl(request, pathSegments)
  const method = request.method
  const headers = new Headers(request.headers)
  for (const headerName of ['host', 'connection', 'content-length', 'expect', 'transfer-encoding']) {
    headers.delete(headerName)
  }

  const body = ['GET', 'HEAD'].includes(method) ? undefined : await request.arrayBuffer()

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: 'manual',
  })

  const responseBody = await response.arrayBuffer()
  const proxyHeaders = new Headers(response.headers)
  proxyHeaders.delete('content-length')

  return new NextResponse(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: proxyHeaders,
  })
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxyRequest(request, path)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxyRequest(request, path)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxyRequest(request, path)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxyRequest(request, path)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxyRequest(request, path)
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params
  return proxyRequest(request, path)
}
