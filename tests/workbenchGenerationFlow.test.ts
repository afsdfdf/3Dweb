import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'

const rootDir = process.cwd()
const workbenchClientPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchClient.tsx')
const workbenchPollingPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_lib', 'workbenchPolling.ts')
const workbenchProgressPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_lib', 'workbenchProgress.ts')
const modelLibraryPanelPath = path.join(rootDir, 'src', 'components', 'ui-lab', 'model-library-panel', 'model-library-panel.tsx')
const workbenchDataPath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_lib', 'workbenchData.ts')
const workbenchPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.tsx')
const accountPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'account', 'page.tsx')
const aiTasksEndpointPath = path.join(rootDir, 'src', 'endpoints', 'aiTasks.ts')
const imageGenerationEndpointPath = path.join(rootDir, 'src', 'endpoints', 'imageGeneration.ts')
const aiTaskFlowPath = path.join(rootDir, 'src', 'lib', 'aiTaskFlow.ts')
const imageGenerationFlowPath = path.join(rootDir, 'src', 'lib', 'imageGenerationFlow.ts')
const mediaUploadURLRoutePath = path.join(rootDir, 'src', 'app', 'api', 'media', 'upload-url', 'route.ts')
const workbenchDraftPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'workbenchDraft.ts')
const resultsPagePath = path.join(rootDir, 'src', 'app', '(frontend)', 'results', '[taskCode]', 'page.tsx')
const resultsPageCssPath = path.join(rootDir, 'src', 'app', '(frontend)', 'results', '[taskCode]', 'page.module.css')
const siteShellPath = path.join(rootDir, 'src', 'app', '(frontend)', '_components', 'SiteShell.tsx')
const authModalStagePath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalStage.tsx')
const authModalStageCssPath = path.join(rootDir, 'src', 'components', 'auth', 'AuthModalStage.module.css')
const uiTextPath = path.join(rootDir, 'src', 'app', '(frontend)', '_lib', 'ui-text.ts')

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

test('Workbench surfaces owned model preview optimization status without file URLs', () => {
  const dataSource = readFileSync(workbenchDataPath, 'utf8')
  const panelsSource = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', '_components', 'WorkbenchPanels.tsx'), 'utf8')

  assert.match(dataSource, /viewerOptimizationStatus/)
  assert.match(dataSource, /formatViewerOptimizationBadge/)
  assert.match(dataSource, /Optimizing preview/)
  assert.match(dataSource, /isOwnedByCurrentUser \? normalizeViewerOptimizationStatus/)
  assert.doesNotMatch(dataSource, /previewFile.*url/i)
  assert.match(panelsSource, /formatViewerOptimizationBadge/)
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

test('Workbench blocks image generation before the user provides a prompt or image', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const imageTaskSource = readFileSync(imageGenerationFlowPath, 'utf8')

  assert.match(clientSource, /imageToolsRequiresInputMessage = "Add a prompt or reference image before generating an image\."/)
  assert.match(clientSource, /const \[prompt, setPrompt\] = useState\(""\)/)
  assert.match(clientSource, /const hasUserPrompt = rawPrompt\.length > 0 && rawPrompt !== workbenchDefaultPrompt/)
  assert.match(clientSource, /activeMode === "imageTools" && images\.length === 0 && !hasUserPrompt/)
  assert.match(imageTaskSource, /inputMode === 'text' && !trimmedPrompt/)
})

test('image generation provider retry stays inside a single backend task', () => {
  const source = readFileSync(imageGenerationFlowPath, 'utf8')

  assert.match(source, /IMAGE_GENERATION_PROVIDER_MAX_ATTEMPTS = 2/)
  assert.match(source, /function generateProviderImageWithRetry/)
  assert.match(source, /isRetryableImageGenerationError/)
  assert.match(source, /internal_server_error/)
  assert.match(source, /terminated/)
  assert.match(source, /retryCount: attempt/)
  assert.match(source, /Image generation provider failed transiently; retrying once\./)
  assert.match(source, /const generated = await generateProviderImageWithRetry/)
  assert.doesNotMatch(source, /createImageGenerationTask\([\s\S]*retrying once/)
})

test('Workbench can promote a generated image into an Image to 3D reference', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const cssSource = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'page.module.css'), 'utf8')

  assert.match(clientSource, /const handleUseSelectedImageFor3D = \(\) =>/)
  assert.match(clientSource, /setGeneratedImageAsReference\(selectedImageCard\)/)
  assert.match(clientSource, /setActiveMode\("image3d"\)/)
  assert.match(clientSource, /Use for 3D/)
  assert.match(cssSource, /\.imageTo3DAction/)
})

test('Workbench rejects Image To 3D submissions without a reference image', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const endpointSource = readFileSync(aiTasksEndpointPath, 'utf8')

  assert.match(clientSource, /const imageTo3DRequiresImageMessage = "Image To 3D requires at least one reference image\."/)
  assert.match(clientSource, /activeMode === "image3d" && images\.length === 0/)
  assert.match(endpointSource, /const inputMode = body\.inputMode === 'hybrid'/)
  assert.match(endpointSource, /isWorkbenchImageTo3DRequest\(parameterSnapshot\)/)
  assert.match(endpointSource, /inputMode === 'hybrid'/)
  assert.match(endpointSource, /Image To 3D requires at least one reference image\./)
})

test('Workbench image generation does not expose public visibility controls', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const panelSource = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchLeftGenerationPanel.tsx'), 'utf8')

  assert.match(clientSource, /activeMode !== "imageTools" \? \(/)
  assert.match(clientSource, /Generated images stay private in your assets\./)
  assert.match(panelSource, /isImageOutputMode \? \(/)
  assert.match(panelSource, /Generated images stay private in your assets\./)
  assert.doesNotMatch(panelSource, /Image Visibility/)
})

test('Workbench source image upload limits are shared between frontend and backend defaults', () => {
  const draftSource = readFileSync(workbenchDraftPath, 'utf8')
  const uploadRouteSource = readFileSync(mediaUploadURLRoutePath, 'utf8')

  assert.match(draftSource, /const DEFAULT_SOURCE_IMAGE_UPLOAD_BYTES = 8 \* 1024 \* 1024/)
  assert.match(uploadRouteSource, /const DEFAULT_SOURCE_IMAGE_UPLOAD_BYTES = 8 \* 1024 \* 1024/)
  assert.match(uploadRouteSource, /const configuredMaxUploadBytes = Number\(process\.env\.NEXT_PUBLIC_MAX_UPLOAD_BYTES\)/)
  assert.match(uploadRouteSource, /Number\.isFinite\(configuredMaxUploadBytes\) && configuredMaxUploadBytes > 0/)
  assert.match(uploadRouteSource, /scope: 'media-upload-url'/)
})

test('Workbench exposes complete mode and upload controls across desktop and mobile', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /modeTabs="triple"/)
  assert.match(source, /Text 3D/)
  assert.match(source, /Image Tools/)
  assert.match(source, /getWorkbenchUploadAccept\(\)/)
  assert.match(source, /placeholder=\{workbenchDefaultPrompt\}/)
  assert.match(source, /Remove an image before adding another reference\./)
  assert.match(source, /Only \$\{maxReferenceImageCount\} reference image/)
  assert.match(source, /router\.back\(\)/)
})

test('Workbench replaces the single image reference instead of leaving upload clicks inert', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const panelSource = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchLeftGenerationPanel.tsx'), 'utf8')

  assert.match(clientSource, /const shouldReplaceSingleImage = activeMode === "imageTools" && maxReferenceImageCount === 1 && nextImages\.length > 0/)
  assert.match(clientSource, /return shouldReplaceSingleImage \? nextImages\.slice\(0, 1\) : \[\.\.\.current, \.\.\.nextImages\]\.slice\(0, maxReferenceImageCount\)/)
  assert.match(panelSource, /const replaceSingleImage = isImageToImage && maxReferenceImages === 1 && images\.length >= maxReferenceImages/)
  assert.match(panelSource, /disabled=\{!canAddMoreImages && !replaceSingleImage\}/)
  assert.match(panelSource, /Replace Image/)
})

test('Workbench only enables multiple Image To 3D references when Multi-View is on', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const panelSource = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchLeftGenerationPanel.tsx'), 'utf8')

  assert.match(clientSource, /const maxReferenceImageCount = activeMode === "image3d" && multiView \? 4 : 1/)
  assert.match(clientSource, /const handleMultiViewChange = \(enabled: boolean\) => \{/)
  assert.match(clientSource, /if \(!enabled\) \{/)
  assert.match(clientSource, /return current\.slice\(0, 1\)/)
  assert.match(clientSource, /const imagesForGeneration = activeMode === "image3d" && multiView \? images : images\.slice\(0, 1\)/)
  assert.match(clientSource, /onMultiViewChange=\{handleMultiViewChange\}/)
  assert.match(panelSource, /const showPrimaryAddImageCard = images\.length === 0 \|\| replaceSingleImage/)
  assert.match(panelSource, /\{showPrimaryAddImageCard \? \(/)
})

test('Meshy uses multi-image 3D only when the Workbench Multi-View flag is enabled', () => {
  const source = readFileSync(aiTaskFlowPath, 'utf8')

  assert.match(source, /const workbenchSnapshot = isRecord\(parameterSnapshot\?\.workbench\) \? parameterSnapshot\.workbench : null/)
  assert.match(source, /const multiViewEnabled = workbenchSnapshot\?\.multiViewEnabled === true/)
  assert.match(source, /if \(imageAssets\.length > 1 && multiViewEnabled\) \{/)
})

test('Workbench can submit another generation while a previous submit is still in flight', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const panelSource = readFileSync(path.join(rootDir, 'src', 'app', '(frontend)', 'workbench', 'WorkbenchLeftGenerationPanel.tsx'), 'utf8')

  assert.match(clientSource, /const \[activeSubmitCount, setActiveSubmitCount\] = useState\(0\)/)
  assert.match(clientSource, /const isSubmitting = activeSubmitCount > 0/)
  assert.match(clientSource, /setActiveSubmitCount\(\(current\) => current \+ 1\)/)
  assert.match(clientSource, /setActiveSubmitCount\(\(current\) => Math\.max\(0, current - 1\)\)/)
  assert.doesNotMatch(clientSource, /if \(isSubmitting\) return/)
  assert.doesNotMatch(clientSource, /disabled=\{isSubmitting\}/)
  assert.doesNotMatch(panelSource, /disabled=\{isSubmitting\}/)
})

test('Model library panel search and pagination operate on visible cards', () => {
  const source = readFileSync(modelLibraryPanelPath, 'utf8')

  assert.match(source, /const filteredCards = useMemo/)
  assert.match(source, /card\.generationStatusLabel/)
  assert.match(source, /const pageCards = filteredCards\.slice/)
  assert.match(source, /setActivePage\(1\)/)
  assert.match(source, /No Matches Found/)
  assert.match(source, /filteredCards\.length\} Items/)
})

test('Workbench uses a moderate provider sync interval by default', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /NEXT_PUBLIC_TASK_SYNC_INTERVAL_MS \|\| 5000/)
})

test('Workbench sync polling batches pending tasks instead of syncing every task each tick', () => {
  const source = readFileSync(workbenchClientPath, 'utf8')

  assert.match(source, /NEXT_PUBLIC_TASK_SYNC_BATCH_SIZE \|\| 2/)
  assert.match(source, /const syncCursorRef = useRef\(0\)/)
  assert.match(source, /selectWorkbenchSyncTasks/)
  assert.match(source, /await Promise\.all\(selectedTasks\.map\(syncTask\)\)/)
  assert.doesNotMatch(source, /Promise\.all\(syncableTasks\.map\(syncTask\)\)/)
})

test('Workbench sync polling prioritizes the active task and rotates background tasks', async () => {
  const { selectWorkbenchSyncTasks } = await import(pathToFileURL(workbenchPollingPath).href)
  const tasks = [
    { cardId: 1, status: 'processing', taskId: 101 },
    { cardId: 2, status: 'processing', taskId: 102 },
    { cardId: 3, status: 'processing', taskId: 103 },
    { cardId: 4, status: 'failed', taskId: 104 },
    { cardId: 5, status: 'queued', taskId: null },
  ]

  const first = selectWorkbenchSyncTasks({
    activePendingCardId: 2,
    batchSize: 2,
    cursor: 0,
    tasks,
  })

  assert.deepEqual(first.selectedTasks.map((task) => task.cardId), [2, 1])
  assert.equal(first.nextCursor, 1)

  const second = selectWorkbenchSyncTasks({
    activePendingCardId: 2,
    batchSize: 2,
    cursor: first.nextCursor,
    tasks,
  })

  assert.deepEqual(second.selectedTasks.map((task) => task.cardId), [2, 3])
  assert.equal(second.nextCursor, 0)
})

test('Workbench sync polling limits batches without an active task', async () => {
  const { selectWorkbenchSyncTasks } = await import(pathToFileURL(workbenchPollingPath).href)
  const tasks = [
    { cardId: 1, status: 'processing', taskId: 101 },
    { cardId: 2, status: 'queued', taskId: 102 },
    { cardId: 3, status: 'timeout', taskId: 103 },
    { cardId: 4, status: 'processing' },
  ]

  const result = selectWorkbenchSyncTasks({
    activePendingCardId: null,
    batchSize: 1,
    cursor: 1,
    tasks,
  })

  assert.deepEqual(result.selectedTasks.map((task) => task.cardId), [2])
  assert.equal(result.nextCursor, 0)
})

test('Workbench pending progress is estimated from average elapsed generation time', async () => {
  const { getEstimatedWorkbenchProgress, getWorkbenchProgressDurationMs } = await import(
    pathToFileURL(workbenchProgressPath).href
  )
  const createdAt = '2026-05-20T00:00:00.000Z'
  const startMs = Date.parse(createdAt)

  assert.equal(getWorkbenchProgressDurationMs('image'), 175000)
  assert.equal(
    getEstimatedWorkbenchProgress(
      { createdAt, kind: 'image', progress: 1, status: 'processing' },
      startMs + 87500,
    ),
    50,
  )
  assert.equal(
    getEstimatedWorkbenchProgress(
      { createdAt, kind: 'image', progress: 1, status: 'queued' },
      startMs + 170000,
    ),
    97,
  )
  assert.equal(
    getEstimatedWorkbenchProgress(
      { createdAt, kind: 'image', progress: 1, status: 'processing' },
      startMs + 240000,
    ),
    99,
  )
})

test('Workbench pending progress does not regress below provider progress or start below 1 percent', async () => {
  const { getEstimatedWorkbenchProgress } = await import(pathToFileURL(workbenchProgressPath).href)
  const createdAt = '2026-05-20T00:00:00.000Z'
  const startMs = Date.parse(createdAt)

  assert.equal(
    getEstimatedWorkbenchProgress(
      { createdAt, kind: 'model', progress: 70, status: 'processing' },
      startMs + 30000,
    ),
    70,
  )
  assert.equal(
    getEstimatedWorkbenchProgress(
      { createdAt, kind: 'model', progress: 0, status: 'uploading' },
      startMs,
    ),
    1,
  )
})

test('image generation background work can be recovered by sync polling', () => {
  const endpointSource = readFileSync(imageGenerationEndpointPath, 'utf8')
  const flowSource = readFileSync(imageGenerationFlowPath, 'utf8')

  assert.match(endpointSource, /setTimeout\(runOnce, 0\)/)
  assert.match(endpointSource, /after\(\(\) => \{/)
  assert.match(endpointSource, /IMAGE_GENERATION_MAX_CONCURRENT_TASKS/)
  assert.match(endpointSource, /imageGeneration\.maxConcurrentTasks/)
  assert.match(endpointSource, /activeImageGenerationWorkCount/)
  assert.match(endpointSource, /scheduledImageGenerationTaskIds/)
  assert.match(endpointSource, /scheduleTaskRun\(\{ req, taskId \}\)/)
  assert.match(endpointSource, /isRunnableImageGenerationStatus\(task\.status\)/)
  assert.match(flowSource, /imageGenerationTaskLocks/)
  assert.match(flowSource, /dispatchStartedAt/)
  assert.match(flowSource, /hasRecentImageGenerationDispatch/)
})

test('image generation only uses the default prompt after explicit text or image input validation', () => {
  const source = readFileSync(imageGenerationFlowPath, 'utf8')
  const textPromptRequired = source.indexOf("inputMode === 'text' && !trimmedPrompt")
  const textPromptError = source.indexOf("throw new Error('Prompt is required.')", textPromptRequired)
  const defaultPrompt = source.indexOf('const defaultPrompt = await readImageGenerationDefaultPrompt(req)')
  const effectivePrompt = source.indexOf('const effectivePrompt = buildEffectiveImagePrompt', defaultPrompt)
  const effectivePromptRequired = source.indexOf("throw new Error('Prompt is required.')", effectivePrompt)

  assert.ok(textPromptRequired >= 0)
  assert.ok(textPromptError > textPromptRequired)
  assert.ok(defaultPrompt >= 0)
  assert.ok(textPromptError < defaultPrompt)
  assert.ok(effectivePrompt > defaultPrompt)
  assert.ok(effectivePromptRequired > effectivePrompt)
  assert.match(source, /USER_PROMPT_PLACEHOLDER = '\{user_prompt\}'/)
  assert.match(source, /defaultPrompt\.replaceAll\(USER_PROMPT_PLACEHOLDER/)
  assert.match(source, /EMPTY_IMAGE_PROMPT_SUBJECT/)
})

test('Workbench image edits send source image URL plus an effective prompt', () => {
  const clientSource = readFileSync(workbenchClientPath, 'utf8')
  const flowSource = readFileSync(imageGenerationFlowPath, 'utf8')
  const gatewaySource = readFileSync(path.join(rootDir, 'src', 'lib', 'geminiImageGateway.ts'), 'utf8')

  assert.match(clientSource, /inputMode: sourceImageAsset \? "image" : "text"/)
  assert.match(clientSource, /prompt: trimmedPrompt/)
  assert.match(clientSource, /sourceImageAsset,/)
  assert.match(
    clientSource,
    /sourceImageAssets\.length > 0 && rawPrompt === workbenchDefaultPrompt\s*\?\s*""\s*:\s*rawPrompt \|\| \(sourceImageAssets\.length > 0 \? "" : workbenchDefaultPrompt\)/,
  )

  assert.match(flowSource, /const effectivePrompt = buildEffectiveImagePrompt/)
  assert.match(flowSource, /defaultPrompt\.replaceAll\(USER_PROMPT_PLACEHOLDER, prompt \|\| EMPTY_IMAGE_PROMPT_SUBJECT\)/)
  assert.match(flowSource, /effectivePrompt,/)
  assert.match(flowSource, /prompt: effectivePrompt/)

  assert.match(gatewaySource, /requestOpenAICompatibleJSONImageEdit/)
  assert.match(gatewaySource, /images:\s*\[\s*\{\s*image_url: args\.sourceImageURL/)
  assert.match(gatewaySource, /prompt: args\.prompt\.trim\(\)/)
  assert.match(gatewaySource, /Image-to-image generation requires an effective prompt\./)
  assert.doesNotMatch(gatewaySource, /input_fidelity/)
})

test('image generation tasks render as image tasks outside Workbench', () => {
  const accountSource = readFileSync(accountPagePath, 'utf8')
  const resultsSource = readFileSync(resultsPagePath, 'utf8')
  const uiTextSource = readFileSync(uiTextPath, 'utf8')

  assert.match(uiTextSource, /export function formatTaskGenerationType/)
  assert.match(uiTextSource, /taskType === 'image-generation'/)
  assert.match(uiTextSource, /Text to Image/)
  assert.match(uiTextSource, /Image to Image/)
  assert.match(accountSource, /formatTaskGenerationType/)
  assert.match(resultsSource, /formatTaskGenerationType/)
})

test('results receipt page owns vertical scrolling inside the fixed site shell', () => {
  const cssSource = readFileSync(resultsPageCssPath, 'utf8')
  const pageSource = readFileSync(resultsPagePath, 'utf8')
  const siteShellSource = readFileSync(siteShellPath, 'utf8')
  const authStageSource = readFileSync(authModalStagePath, 'utf8')
  const authStageCssSource = readFileSync(authModalStageCssPath, 'utf8')

  assert.match(pageSource, /layoutMode="document"/)
  assert.match(cssSource, /\.receiptPage\s*\{/)
  assert.match(cssSource, /min-height:\s*100%;/)
  assert.match(siteShellSource, /layoutMode\?: 'document' \| 'fixed'/)
  assert.match(siteShellSource, /layoutMode === 'document'/)
  assert.match(siteShellSource, /<AuthModalStage clipContent=\{false\}>/)
  assert.match(authStageSource, /clipContent = true/)
  assert.match(authStageCssSource, /\.stageUnclipped/)
})
