import AsyncStorage from "@react-native-async-storage/async-storage";
import { InventoryItem } from "../types/inventory";
import { recategorizeItems, getCategoriesForWebsite } from "./recategorizer";

export interface RecategorizationJob {
  id: string;
  websiteUrl: string;
  totalItems: number;
  processedItems: number;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: number;
  completedAt?: number;
  error?: string;
  changes: { id: string; oldCategory: string; newCategory: string; oldSubcategory?: string; newSubcategory: string }[];
}

const STORAGE_KEY = "recategorization-jobs";

/**
 * Get all recategorization jobs
 */
export async function getJobs(): Promise<RecategorizationJob[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading recategorization jobs:", error);
    return [];
  }
}

/**
 * Save jobs to storage
 */
async function saveJobs(jobs: RecategorizationJob[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (error) {
    console.error("Error saving recategorization jobs:", error);
  }
}

/**
 * Create a new recategorization job
 */
export async function createJob(
  websiteUrl: string,
  totalItems: number
): Promise<RecategorizationJob> {
  const job: RecategorizationJob = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
    websiteUrl,
    totalItems,
    processedItems: 0,
    status: "pending",
    startedAt: Date.now(),
    changes: [],
  };

  const jobs = await getJobs();
  jobs.push(job);
  await saveJobs(jobs);

  return job;
}

/**
 * Update a job's status and progress
 */
export async function updateJob(
  jobId: string,
  updates: Partial<RecategorizationJob>
): Promise<void> {
  const jobs = await getJobs();
  const index = jobs.findIndex((j) => j.id === jobId);

  if (index !== -1) {
    jobs[index] = { ...jobs[index], ...updates };
    await saveJobs(jobs);
  }
}

/**
 * Get active (pending or running) job
 */
export async function getActiveJob(): Promise<RecategorizationJob | null> {
  const jobs = await getJobs();
  return jobs.find((j) => j.status === "pending" || j.status === "running") || null;
}

/**
 * Clear completed jobs older than 24 hours
 */
export async function clearOldJobs(): Promise<void> {
  const jobs = await getJobs();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

  const filtered = jobs.filter((job) => {
    if (job.status === "completed" || job.status === "failed") {
      return (job.completedAt || job.startedAt) > cutoff;
    }
    return true; // Keep pending/running jobs
  });

  await saveJobs(filtered);
}

/**
 * Execute a recategorization job in the background
 */
export async function executeJob(
  jobId: string,
  items: InventoryItem[],
  onProgress?: (job: RecategorizationJob) => void
): Promise<void> {
  try {
    // Mark as running
    await updateJob(jobId, {
      status: "running",
      processedItems: 0,
    });

    // Get the job to find website URL
    const jobs = await getJobs();
    const job = jobs.find((j) => j.id === jobId);

    if (!job) {
      throw new Error("Job not found");
    }

    // Get categories for website
    const categoryStructure = await getCategoriesForWebsite(job.websiteUrl);

    // Run recategorization
    const changes = await recategorizeItems(
      items,
      categoryStructure,
      async (message: string, current: number, total: number) => {
        await updateJob(jobId, {
          processedItems: current,
        });

        if (onProgress) {
          const updatedJobs = await getJobs();
          const updatedJob = updatedJobs.find((j) => j.id === jobId);
          if (updatedJob) {
            onProgress(updatedJob);
          }
        }
      }
    );

    // Mark as completed
    await updateJob(jobId, {
      status: "completed",
      completedAt: Date.now(),
      processedItems: items.length,
      changes,
    });

    if (onProgress) {
      const updatedJobs = await getJobs();
      const completedJob = updatedJobs.find((j) => j.id === jobId);
      if (completedJob) {
        onProgress(completedJob);
      }
    }
  } catch (error) {
    console.error("Error executing recategorization job:", error);
    await updateJob(jobId, {
      status: "failed",
      completedAt: Date.now(),
      error: error instanceof Error ? error.message : "Unknown error",
    });

    if (onProgress) {
      const updatedJobs = await getJobs();
      const failedJob = updatedJobs.find((j) => j.id === jobId);
      if (failedJob) {
        onProgress(failedJob);
      }
    }
  }
}
