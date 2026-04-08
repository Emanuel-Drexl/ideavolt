'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../lib/supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ideas, setIdeas] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingIdea, setEditingIdea] = useState<any>(null)
  
  // Formular-Felder
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [rating, setRating] = useState(3)
  const [status, setStatus] = useState('draft')
  
  // Filter & Suche
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
    } else {
      setUser(user)
      loadData()
    }
    setLoading(false)
  }

  const loadData = async () => {
    // Kategorien laden
    const { data: cats } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (cats) setCategories(cats)

    // Ideen laden
    const { data: ideasData } = await supabase
      .from('ideas')
      .select('*, categories(name, color)')
      .order('created_at', { ascending: false })
    
    if (ideasData) setIdeas(ideasData)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const createIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('ideas')
      .insert([
        {
          user_id: user.id,
          title,
          description,
          category_id: categoryId || null,
          rating,
          status,
        }
      ])

    if (!error) {
      closeModal()
      loadData()
    }
  }

  const deleteIdea = async (id: string) => {
    if (!confirm('Möchtest du diese Idee wirklich löschen?')) return
    
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id)

    if (!error) {
      loadData()
    }
  }

  const openEditModal = (idea: any) => {
    setEditingIdea(idea)
    setTitle(idea.title)
    setDescription(idea.description || '')
    setCategoryId(idea.category_id || '')
    setRating(idea.rating)
    setStatus(idea.status || 'draft')
    setShowModal(true)
  }

  const updateIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase
      .from('ideas')
      .update({
        title,
        description,
        category_id: categoryId || null,
        rating,
        status,
      })
      .eq('id', editingIdea.id)

    if (!error) {
      closeModal()
      loadData()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (editingIdea) {
      updateIdea(e)
    } else {
      createIdea(e)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingIdea(null)
    setTitle('')
    setDescription('')
    setCategoryId('')
    setRating(3)
    setStatus('draft')
  }

  // Gefilterte Ideen
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (idea.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !filterCategory || idea.category_id === filterCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">💡 IdeaVault</h1>
            <p className="text-blue-100 text-sm mt-1">Dein digitales Ideenbuch</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium shadow-md"
          >
            Ausloggen
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-white to-blue-50 rounded-2xl shadow-xl p-8 mb-8 border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Willkommen zurück! 🎉
              </h2>
              <p className="text-gray-600 text-lg">
                Eingeloggt als: <span className="font-semibold text-gray-900">{user?.email}</span>
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              ✨ Neue Idee
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2">Ideen</h3>
                <p className="text-4xl font-bold text-blue-600 mt-2">{ideas.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-2xl">💡</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">Gespeicherte Ideen</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2">Kategorien</h3>
                <p className="text-4xl font-bold text-green-600 mt-2">{categories.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <span className="text-2xl">📁</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">Verfügbare Kategorien</p>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-600 text-sm uppercase tracking-wide mb-2">Durchschnitt</h3>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {ideas.length > 0 ? (ideas.reduce((sum, i) => sum + i.rating, 0) / ideas.length).toFixed(1) : '0'}⭐
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-3">Bewertung deiner Ideen</p>
          </div>
        </div>

        {/* Filter & Suche */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Suchfeld */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 Suche</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Suche nach Titel oder Beschreibung..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>

            {/* Kategorie-Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">📁 Kategorie</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">Alle Kategorien</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {(searchTerm || filterCategory) && (
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilterCategory('')
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-all"
                >
                  ✕ Zurücksetzen
                </button>
              </div>
            )}
          </div>

          {/* Ergebnis-Anzeige */}
          {(searchTerm || filterCategory) && (
            <div className="mt-4 text-sm text-gray-600">
              {filteredIdeas.length} {filteredIdeas.length === 1 ? 'Ergebnis' : 'Ergebnisse'} gefunden
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-white p-6 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-800">🚀 Deine Ideen</h3>
          </div>
          <div className="p-6">
            {filteredIdeas.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💭</div>
                <p className="text-gray-500 text-xl mb-6">
                  {searchTerm || filterCategory ? 'Keine Ideen gefunden' : 'Noch keine Ideen vorhanden'}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium shadow-lg transition-all"
                >
                  Erstelle deine erste Idee →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIdeas.map((idea) => (
                  <div 
                    key={idea.id} 
                    className="border-2 border-gray-100 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all bg-gradient-to-r from-white to-gray-50"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-xl text-gray-800 mb-2">{idea.title}</h4>
                        {idea.description && (
                          <p className="text-gray-600 leading-relaxed">{idea.description}</p>
                        )}
                        <div className="flex gap-3 mt-4 flex-wrap">
                          {idea.categories && (
                            <span
                              className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md"
                              style={{ backgroundColor: idea.categories.color }}
                            >
                              {idea.categories.name}
                            </span>
                          )}
                          <span className="px-4 py-2 bg-yellow-50 rounded-full text-sm font-medium border border-yellow-200">
                            {'⭐'.repeat(idea.rating)}
                          </span>
                          <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            idea.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                            idea.status === 'evaluating' ? 'bg-blue-100 text-blue-700' :
                            idea.status === 'building' ? 'bg-orange-100 text-orange-700' :
                            idea.status === 'launched' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {idea.status === 'draft' ? '📝 Entwurf' :
                             idea.status === 'evaluating' ? '🔍 Bewerten' :
                             idea.status === 'building' ? '🔨 Bauen' :
                             idea.status === 'launched' ? '🚀 Live' :
                             '❌ Verworfen'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openEditModal(idea)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-all flex items-center gap-2"
                        >
                          ✏️ Bearbeiten
                        </button>
                        <button
                          onClick={() => deleteIdea(idea.id)}
                          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-all flex items-center gap-2"
                        >
                          🗑️ Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
              <h3 className="text-2xl font-bold text-white">
                {editingIdea ? '✏️ Idee bearbeiten' : '✨ Neue Idee erstellen'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titel *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="z.B. KI-gestützte Marketing-Plattform"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  rows={4}
                  placeholder="Was macht deine Idee besonders?"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Kategorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">-- Keine Kategorie --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="draft">📝 Entwurf</option>
                  <option value="evaluating">🔍 Bewerten</option>
                  <option value="building">🔨 Bauen</option>
                  <option value="launched">🚀 Live</option>
                  <option value="discarded">❌ Verworfen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bewertung: <span className="text-blue-600 font-bold">{rating}⭐</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1⭐</span>
                  <span>5⭐</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-semibold shadow-lg transition-all"
                >
                  💾 Speichern
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 font-semibold transition-all"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
