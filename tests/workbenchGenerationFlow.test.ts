import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const rootDir = process.cwd()
const workbenchClientPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchClient.tsx')
const workbenchDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_lib', 'workbenchData.ts')
const workbenchPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.tsx')
const aiTasksEndpointPath = path.join(rootDir, 'src', 'endpoints', 'aiTasks.ts')
const aiTaskFlowPath = path.join(rootDir, 'src', 'lib', 'aiTaskFlow.ts')
const imageGenerationFlowPath = path.join(rootDir, 'src', 'lib', 'imageGenerationFlow.ts')

test('Workbench keeps 3D generation on the current page and polls task sync', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /type PendingGenerationTask = /)
  assert.match(source, /Waiting for task code/)
  assert.match(source, /fetch\(syncEndpoint/)
  assert.match(source, /setPendingTasks\(\(current\) => \[pendingTask, \.\.\.current\]\)/)
  assert.match(source, /buildViewerURL\(modelId\)/)
  assert.match(source, /Finalizing model/)
  assert.match(source, /Math\.min\(99,\s*Math\.max\(progress,\s*96\)\)/)
  assert.doesNotMatch(source, /router\.push\(`\/results\/\$\{taskCode\}`\)/)
  assert.doesNotMatch(source, /router\.push\("\/results\//)
})

test('AI task sync endpoint returns the refreshed succeeded task', () => {
  const source = readFileSync(aiTasksEndpointPath, 'utf8')

  assert.match(source, /const responseTask =/)
  assert.match(source, /task\.status === 'succeeded'/)
  assert.match(source, /collection: 'generation-tasks'/)
  assert.match(source, /user: req\.user/)
  assert.match(source, /task: responseTask/)
})

test('Meshy sync maps provider stages into Workbench progress ranges', () => {
  const source = readFileSync(aiTaskFlowPath, 'utf8')

  assert.match(source, /const getMeshyStageProgress = /)
  assert.match(source, /stage: 'preview'/)
  assert.match(source, /max: 55/)
  assert.match(source, /stage: 'refine'/)
  assert.match(source, /max: 96/)
  assert.match(source, /stage: 'multi-image'/)
  assert.match(source, /stage: 'image'/)
})

test('generation submissions check credits before task records are created', () => {
  const aiTaskSource = readFileSync(aiTaskFlowPath, 'utf8')
  const imageTaskSource = readFileSync(imageGenerationFlowPath, 'utf8')
  const aiSubmitStart = aiTaskSource.indexOf('export async function submitAITask')
  const aiCreditCheck = aiTaskSource.indexOf('await assertTaskCreditsAvailable({', aiSubmitStart)
  const aiTaskCreate = aiTaskSource.indexOf("const task = await req.payload.create({", aiSubmitStart)
  const imageSubmitStart = imageTaskSource.indexOf('export async function createImageGenerationTask')
  const imageCreditCheck = imageTaskSource.indexOf('await assertTaskCreditsAvailable({', imageSubmitStart)
  const imageTaskCreate = imageTaskSource.indexOf("const task = await req.payload.create({", imageSubmitStart)

  assert.ok(aiSubmitStart >= 0)
  assert.ok(aiCreditCheck > aiSubmitStart)
  assert.ok(aiTaskCreate > aiCreditCheck)
  assert.ok(imageSubmitStart >= 0)
  assert.ok(imageCreditCheck > imageSubmitStart)
  assert.ok(imageTaskCreate > imageCreditCheck)
})

test('Workbench treats insufficient credits as an unsubmitted request', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /const insufficientCreditsMessage = "Insufficient credits\. Please add credits before generating\."/)
  assert.match(source, /const requiredCredits = activeGenerationCreditCost/)
  assert.match(source, /getNavUserCreditBalance\(navUser\) < requiredCredits/)
  assert.match(source, /buildInsufficientCreditsMessage\(requiredCredits\)/)
  assert.match(source, /status === 402/)
  assert.match(source, /current\.filter\(\(item\) => item\.cardId !== pendingCardId\)/)
})

test('Workbench displays the active backend generation credit cost', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /const activeGenerationCreditCost = getActiveGenerationCreditCost/)
  assert.match(source, /generationCreditCost=\{activeGenerationCreditCost\}/)
})

test('Workbench restores unfinished backend generation tasks after refresh', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const dataSource = readFileSync(workbenchDataPath, 'utf8')
  const pageSource = readFileSync(workbenchPagePath, 'utf8')

  assert.match(dataSource, /export async function getWorkbenchGenerationTaskState/)
  assert.match(dataSource, /export async function getWorkbenchPendingGenerationTasks/)
  assert.match(dataSource, /or:\s*\[/)
  assert.match(dataSource, /status:\s*\{\s*in:\s*\["queued", "processing"\]/)
  assert.match(dataSource, /isPendingImageGenerationTask/)
  assert.match(dataSource, /taskType === "image-generation"/)
  assert.match(pageSource, /getWorkbenchGenerationTaskState\(user\)/)
  assert.match(pageSource, /initialPendingTasks=\{pendingGenerationTasks\}/)
  assert.match(clientSource, /initialPendingTasks = \[\]/)
  assert.match(clientSource, /incomingTasksByKey/)
  assert.match(clientSource, /\(\) => initialPendingTasks\[0\]\?\.cardId \?\? null/)
  assert.match(clientSource, /\(\) => initialPendingTasks/)
})

test('Workbench submits image generation as an async pending image task', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const imageTaskSource = readFileSync(imageGenerationFlowPath, 'utf8')

  assert.match(clientSource, /const pendingKind: PendingGenerationTask\["kind"\] = activeMode === "imageTools" \? "image" : "model"/)
  assert.match(clientSource, /\/api\/studio\/ai\/images\/\$\{task\.taskId\}\/sync/)
  assert.match(clientSource, /setImageAssetCards/)
  assert.match(clientSource, /styles\.imagePreviewCard/)
  assert.match(imageTaskSource, /export async function createImageGenerationTask/)
  assert.match(imageTaskSource, /export async function runImageGenerationTask/)
  assert.match(imageTaskSource, /dispatchProvider === false/)
})

test('Workbench uses a moderate provider sync interval by default', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /NEXT_PUBLIC_TASK_SYNC_INTERVAL_MS \|\| 5000/)
})
