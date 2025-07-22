import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Upload, X, Search, Filter, Package, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { AxiosInstance } from '../routes/axiosInstance';
import { GlobalAuthContext } from '../authContext/AuthContext';
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useContext } from "react";

const AdminPanel = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    totalStock: '',
    salePrice: '',
    image: ''
  });
 const { loggedInUser, setLoggedInUser, authUser } =
    useContext(GlobalAuthContext);
  console.log(loggedInUser);
  const handleLogout = async () => {
    try {
      const res = await AxiosInstance.post("/user/logout");
      console.log(res);
      if (res.data.success) {
        toast.success(res.data.message);
        setLoggedInUser(false);
        navigate("/login");
      }
    } catch (error) {
      console.log(error);
      toast.error("logout failed");
    }
  };

  // Fetch all products from backend
  const fetchProducts = async () => {
    try {
      setPageLoading(true);
      const response = await AxiosInstance.get("/admin/product/all");
      if (response.data.success) {
        setProducts(response.data.data);
        setFilteredProducts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
      // Fallback to empty array if API fails
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setPageLoading(false);
    }
  };

  // Load products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterCategory) {
      filtered = filtered.filter(product =>
        product.category === filterCategory
      );
    }

    setFilteredProducts(filtered);
  }, [searchTerm, filterCategory, products]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      brand: '',
      price: '',
      totalStock: '',
      salePrice: '',
      image: ''
    });
    setImagePreview('');
    setImageFile(null);
  };

  const openModal = (mode, product = null) => {
    setModalMode(mode);
    if (mode === 'edit' && product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description,
        category: product.category,
        brand: product.brand,
        price: product.price.toString(),
        totalStock: product.totalStock.toString(),
        salePrice: product.salePrice.toString(),
        image: product.image
      });
      setImagePreview(product.image);
    } else {
      resetForm();
      setEditingProduct(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
    setEditingProduct(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Upload image to backend
  const uploadImage = async (file) => {
    try {
      const formDataForImage = new FormData();
      formDataForImage.append('image', file);
      
      const response = await AxiosInstance.post("/admin/product/upload-image", formDataForImage, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        return response.data.data.secure_url;
      } else {
        throw new Error("Image upload failed");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = formData.image;
      
      // Upload new image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
        if (!imageUrl) {
          setLoading(false);
          return;
        }
      }

      const productData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        brand: formData.brand,
        price: parseFloat(formData.price),
        salePrice: parseFloat(formData.salePrice) || parseFloat(formData.price),
        totalStock: parseInt(formData.totalStock),
        image: imageUrl
      };

      let response;
      if (modalMode === 'add') {
        response = await AxiosInstance.post("/admin/product/add", productData);
      } else {
        response = await AxiosInstance.patch(`/admin/product/update/${editingProduct.id}`, productData);
      }

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchProducts(); // Refresh the products list
        closeModal();
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(error.response?.data?.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {

      try {
        const response = await AxiosInstance.delete(`/admin/product/delete/${id}`);
        if (response.data.success) {
          toast.success(response.data.message);
          await fetchProducts(); // Refresh the products list
        }
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error(error.response?.data?.message || "Failed to delete product");
      }

  };

  const categories = [...new Set(products.map(p => p.category))];
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.totalStock), 0);
  const lowStockProducts = products.filter(p => p.totalStock < 20).length;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-semibold text-slate-800">Loading products...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Package className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Panel
                </h1>
                <p className="text-slate-600">Product Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openModal('add')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Product</span>
              </button>
              <div className="relative">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Products</p>
                <p className="text-3xl font-bold text-slate-800">{totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Value</p>
                <p className="text-3xl font-bold text-slate-800">${totalValue.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Categories</p>
                <p className="text-3xl font-bold text-slate-800">{categories.length}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-xl">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Low Stock</p>
                <p className="text-3xl font-bold text-slate-800">{lowStockProducts}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 mb-8">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                <select
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product._id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => openModal('edit', product)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="bg-white bg-opacity-90 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
                {product.salePrice < product.price && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                    Sale
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-bold text-slate-800 mb-2 line-clamp-2">{product.title}</h3>
                <p className="text-slate-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg text-xs font-medium">
                    {product.category}
                  </span>
                  <span className="text-slate-600 text-sm">{product.brand}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    {product.salePrice < product.price ? (
                      <>
                        <span className="text-lg font-bold text-green-600">${product.salePrice}</span>
                        <span className="text-sm text-slate-500 line-through">${product.price}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold text-slate-800">${product.price}</span>
                    )}
                  </div>
                  <span className={`text-sm font-medium ${product.totalStock < 20 ? 'text-red-600' : 'text-green-600'}`}>
                    Stock: {product.totalStock}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && !pageLoading && (
          <div className="text-center py-12">
            <div className="bg-slate-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No products found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-800">
                {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="h-6 w-6 text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Product Image</label>
                  <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-xl mx-auto"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setImageFile(null);
                            setFormData(prev => ({ ...prev, image: '' }));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-600">Click to upload or drag and drop</p>
                        <p className="text-slate-500 text-sm">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Sale Price</label>
                  <input
                    type="number"
                    name="salePrice"
                    value={formData.salePrice}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Stock *</label>
                  <input
                    type="number"
                    name="totalStock"
                    value={formData.totalStock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    min="0"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-3 border border-slate-300 text-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  <span>{loading ? 'Saving...' : modalMode === 'add' ? 'Add Product' : 'Update Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;