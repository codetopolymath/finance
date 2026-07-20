import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useCreateTask } from '@/lib/focusQueries'

/** One-step capture — only a title is ever required, per spec §3. */
export function TaskCaptureBar() {
  const [title, setTitle] = useState('')
  const create = useCreateTask()

  const submit = () => {
    const trimmed = title.trim()
    if (!trimmed) return
    create.mutate({ title: trimmed }, { onSuccess: () => setTitle('') })
  }

  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add a task…"
        className="h-11"
        aria-label="New task title"
      />
      <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!title.trim() || create.isPending}>
        <Plus />
      </Button>
    </form>
  )
}
