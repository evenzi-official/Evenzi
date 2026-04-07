/**
 * Test setup file for runner tests.
 * Makes Node.js built-in 'fs' module spyable via vi.mock.
 */
import { vi } from 'vitest'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>()
  return {
    ...actual,
  }
})
