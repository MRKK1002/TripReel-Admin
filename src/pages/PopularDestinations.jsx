import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Star,
  Clock,
  MapPin,
  Search,
  Save,
} from "lucide-react";
import Modal from "../components/Modal";
import { destinationsAPI } from "../services/api";
import { useApi } from "../hooks/useApi";

const emptyForm = {
  name: "",
  location: "",
  rating: 4.5,
  duration: "",
  price: "",
  image: "",
  isPopular: false,
};

function PopularDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const { loading, error, run } = useApi();

  const fetchDestinations = async () => {
    try {
      const res = await destinationsAPI.getAll();
      setDestinations(res.data.destinations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const filtered = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      location: item.location,
      rating: item.rating,
      duration: item.duration,
      price: item.price,
      image: item.image,
      isPopular: item.isPopular,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    await run(async () => {
      const payload = {
        ...formData,
        price: Number(formData.price),
        rating: Number(formData.rating),
      };
      if (editingItem) {
        await destinationsAPI.update(editingItem._id, payload);
      } else {
        await destinationsAPI.create(payload);
      }
      await fetchDestinations();
      setIsModalOpen(false);
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this destination?")) return;
    await run(async () => {
      await destinationsAPI.delete(id);
      setDestinations((prev) => prev.filter((d) => d._id !== id));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Popular Destinations
          </h1>
          <p className="text-gray-500 mt-1">
            Manage popular travel destinations
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Add Destination
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search destinations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none flex-1 text-gray-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((dest) => (
          <div
            key={dest._id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow"
          >
            <div className="relative h-48">
              <img
                src={dest.image}
                alt={dest.name}
                className="w-full h-full object-cover"
              />
              {dest.isPopular && (
                <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-500 text-white text-xs font-medium rounded-full">
                  Popular
                </span>
              )}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(dest)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg"
                >
                  <Edit2 className="w-4 h-4 text-gray-700" />
                </button>
                <button
                  onClick={() => handleDelete(dest._id)}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors shadow-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{dest.name}</h3>
              <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                <MapPin className="w-4 h-4" />
                {dest.location}
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    {dest.rating}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {dest.duration}
                  </span>
                </div>
                <span className="text-primary-600 font-semibold">
                  From ₹{Number(dest.price).toLocaleString()}/guest
                </span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-gray-400">
            No destinations found.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Destination" : "Add New Destination"}
      >
        <div className="space-y-4">
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) =>
                setFormData((p) => ({ ...p, image: e.target.value }))
              }
              placeholder="Enter image URL"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-2 h-24 w-full object-cover rounded-lg"
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((p) => ({ ...p, name: e.target.value }))
              }
              placeholder="Destination name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData((p) => ({ ...p, location: e.target.value }))
              }
              placeholder="City, Country"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rating
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, rating: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, price: e.target.value }))
                }
                placeholder="8999"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="text"
              value={formData.duration}
              onChange={(e) =>
                setFormData((p) => ({ ...p, duration: e.target.value }))
              }
              placeholder="3 Days - 2 Nights"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPopular"
              checked={formData.isPopular}
              onChange={(e) =>
                setFormData((p) => ({ ...p, isPopular: e.target.checked }))
              }
              className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500"
            />
            <label
              htmlFor="isPopular"
              className="text-sm font-medium text-gray-700"
            >
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
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PopularDestinations;
