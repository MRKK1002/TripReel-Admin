import { useState } from 'react'
import { Plus, Edit2, Trash2, Star, Clock, MapPin, Search, Save } from 'lucide-react'
import Modal from '../components/Modal'

function CuratedPackages() {
  const [packages, setPackages] = useState([
    {
      id: 1,
      name: 'Goa Weekend Escape',
      description: 'Beach stay + sightseeing',
      location: 'Goa, India',
      rating: 4.5,
      duration: '3 Days - 2 Nights',
      price: 8999,
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-04-16%20at%203.18.45%20PM-LsRr4BFdD7UURVEXNukefoogVuTi7v.jpeg',
      isPopular: true
    },
    {
      id: 2,
      name: 'Honeymoon in Bali',
      description: 'Private villas & experiences',
      location: 'Bali, Indonesia',
      rating: 4.5,
      duration: '5 Days - 4 Nights',
      price: 45999,
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-04-16%20at%203.18.45%20PM%20%281%29-DZ7n1H1QKiECgosTkCyOUG7QbpNdu7.jpeg',
      isPopular: true
    },
    {
      id: 3,
      name: 'Kerala Backwaters',
      description: 'Houseboat stay & Ayurveda',
      location: 'Kerala, India',
      rating: 4.7,
      duration: '4 Days - 3 Nights',
      price: 15999,
      image: 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WhatsApp%20Image%202026-04-16%20at%203.18.45%20PM%20%282%29-RKcxYNbLf5PsVqpr9vUi6XoxEldQqw.jpeg',
      isPopular: false
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    rating: 4.5,
    duration: '',
    price: '',
    image: '',
    isPopular: false
  })

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      location: item.location,
      rating: item.rating,
      duration: item.duration,
      price: item.price,
      image: item.image,
      isPopular: item.isPopular
    })
    setIsModalOpen(true)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      location: '',
      rating: 4.5,
      duration: '',
      price: '',
      image: '',
      isPopular: false
    })
    setIsModalOpen(true)
  }

  const handleSave = () => {
    if (editingItem) {
      setPackages(packages.map(p =>
        p.id === editingItem.id ? { ...p, ...formData } : p
      ))
    } else {
      setPackages([...packages, { id: Date.now(), ...formData }])
    }
    setIsModalOpen(false)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      setPackages(packages.filter(p => p.id !== id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Curated Packages</h1>
          <p className="text-gray-500 mt-1">Manage curated travel packages</p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Add Package
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none flex-1 text-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
            <div className="relative h-48">
              <img
                src={pkg.image}
                alt={pkg.name}
                className="w-full h-full object-cover"
              />
              {pkg.isPopular && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                  Popular
                </span>
              )}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg"
                >
                  <Edit2 className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{pkg.name}</h3>
              <p className="text-sm text-gray-500">{pkg.description}</p>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-2">
                <MapPin className="w-4 h-4" />
                {pkg.location}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {pkg.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {pkg.duration}
                  </span>
                </div>
                <span className="text-primary-600 font-semibold">
                  From ₹{pkg.price.toLocaleString()}/guest
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Package' : 'Add New Package'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="Enter image URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
            {formData.image && (
              <img src={formData.image} alt="Preview" className="mt-2 h-24 w-full object-cover rounded-lg" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Package name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Beach stay + sightseeing"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="City, Country"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                placeholder="8999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="3 Days - 2 Nights"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPopular"
              checked={formData.isPopular}
              onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
              className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
            />
            <label htmlFor="isPopular" className="text-sm font-medium text-gray-700">
              Mark as Popular
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default CuratedPackages
