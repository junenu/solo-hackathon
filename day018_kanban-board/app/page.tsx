import { KanbanBoard } from '@/components/KanbanBoard';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              カンバンボード
            </h1>
            <div className="text-sm text-gray-500">
              タスク管理ツール
            </div>
          </div>
        </div>
      </header>
      <main>
        <KanbanBoard />
      </main>
    </div>
  );
}
