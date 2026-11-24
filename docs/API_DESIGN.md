# API 设计

第一阶段为**本地优先**：数据服务全部在浏览器内完成，不依赖后端。接口保持抽象，为未来服务端 / 账号体系 / AI 模型接入预留扩展点。

## 数据服务接口（`src/services/`）

### storageService

```ts
storageService.get<T>(collection, id): T | null
storageService.set<T>(collection, id, value): void
storageService.remove(collection, id): void
storageService.listIds(collection): string[]
storageService.list<T>(collection, sortBy?): T[]
storageService.putBlob(key, value): Promise<void>   // IndexedDB
storageService.getBlob(key): Promise<string | null>
storageService.removeBlob(key): Promise<void>
storageService.clearCollection(collection): void
```

### configService

```ts
configService.list(): ExperimentConfigRecord[]
configService.get(id): ExperimentConfigRecord | null
configService.save(experimentId, config, name?): ExperimentConfigRecord
configService.remove(id): void
configService.getForExperiment(experimentId): ExperimentConfigRecord | null
```

### remixService

```ts
remixService.list(): Remix[]
remixService.get(id): Remix | null
remixService.create(input): Remix
remixService.update(id, patch): Remix | null
remixService.saveVersion(id, config, description?): Remix | null
remixService.restoreVersion(remixId, versionId): Remix | null
remixService.versions(remixId): RemixVersion[]
remixService.remove(id): void
```

### promptService

```ts
promptService.list(): Prompt[]
promptService.get(id): Prompt | null
promptService.create(input): Prompt
promptService.update(id, patch): Prompt | null
promptService.saveNewVersion(id, input): Prompt | null
promptService.restoreVersion(promptId, versionId): Prompt | null
promptService.versions(promptId): PromptVersion[]
promptService.toggleFavorite(id): Prompt | null
promptService.remove(id): void
```

### workService

```ts
workService.list(): Work[]
workService.get(id): Work | null
workService.create(input): Work
workService.update(id, patch): Work | null
workService.toggleFavorite(id): Work | null
workService.attachPrompt(workId, promptId): Work | null
workService.detachPrompt(workId, promptId): Work | null
workService.remove(id): void
```

## AI 服务预留接口

提示词生成当前由 `features/prompt-generator/promptEngine.ts`（本地模板引擎）完成。

未来接入真实模型的统一服务层接口（示例，尚未实现网络层）：

```ts
interface AiProvider {
  id: 'openai' | 'gemini' | 'claude' | 'generic'
  generatePrompt(input: GeneratePromptInput): Promise<string>
}

interface AiService {
  providers: Record<string, AiProvider>
  generate(input: GeneratePromptInput): Promise<string>  // 可插拔
}
```

> 安全约束：所有 API Key 必须放在服务端，禁止在浏览器代码中暴露。
