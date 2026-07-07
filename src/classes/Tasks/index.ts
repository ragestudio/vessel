export class Tasks {
	tasks: (() => Promise<void>)[] = []

	add(task: () => Promise<void>) {
		this.tasks.push(task)
	}

	remove(task: () => Promise<void>) {
		this.tasks = this.tasks.filter((t) => t !== task)
	}

	clear() {
		this.tasks = []
	}

	async run() {
		for (const task of this.tasks) {
			await task()
		}
	}
}

export default Tasks
