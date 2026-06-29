import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const routeDir = path.join(rootDir, 'src', 'app', '(frontend)', 'model-base-test')
const pagePath = path.join(routeDir, 'page.tsx')
const clientPath = path.join(routeDir, 'ModelBaseTestClient.tsx')
const stylesPath = path.join(routeDir, 'page.module.css')
const baseAssetPath = path.join(rootDir, 'public', 'model-base-test', 'base-platform.stl')

test('model base test route renders the STL base attachment sandbox', () => {
  assert.equal(existsSync(pagePath), true)
  assert.equal(existsSync(clientPath), true)
  assert.equal(existsSync(stylesPath), true)
  assert.equal(existsSync(baseAssetPath), true)

  const pageSource = readFileSync(pagePath, 'utf8')
  const clientSource = readFileSync(clientPath, 'utf8')

  assert.match(pageSource, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/)
  assert.match(pageSource, /DEFAULT_TEST_MODEL_ID\s*=\s*"3"/)
  assert.match(pageSource, /basePlatformSrc="\/model-base-test\/base-platform\.stl"/)
  assert.match(pageSource, /modelId/)
  assert.match(pageSource, /modelSrc/)

  assert.match(clientSource, /^"use client";/)
  assert.match(clientSource, /STLLoader/)
  assert.match(clientSource, /GLTFLoader/)
  assert.match(clientSource, /basePlatformSrc/)
  assert.match(clientSource, /modelId/)
  assert.match(clientSource, /modelSrc/)
  assert.match(clientSource, /const MODEL_MAX_NORMALIZED_HEIGHT = 2\.35/)
})
