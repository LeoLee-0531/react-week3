import { useState, useEffect, useRef, useReducer } from "react";
import { Modal } from "bootstrap";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

function App() {
  const [isAuth, setIsAuth] = useState(false);

  const [products, setProducts] = useState([]);

  const [account, setAccount] = useState({
    username: "example@test.com",
    password: "example",
  });

  const handleLoginInputChange = (e) => {
    const { value, name } = e.target;

    setAccount({
      ...account,
      [name]: value,
    });
  };

  const getProducts = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/v2/api/${API_PATH}/admin/products`
      );
      setProducts(res.data.products);
    } catch (error) {
      alert("取得產品失敗");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(`${BASE_URL}/v2/admin/signin`, account);

      const { token, expired } = res.data;
      document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;

      axios.defaults.headers.common["Authorization"] = token;
      checkUserLogin();
    } catch (error) {
      alert("登入失敗");
    }
  };

  const checkUserLogin = async () => {
    try {
      await axios.post(`${BASE_URL}/v2/api/user/check`);
      getProducts();
      setIsAuth(true);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const token = document.cookie.replace(
      /(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/,
      "$1"
    );
    axios.defaults.headers.common["Authorization"] = token;
    checkUserLogin();
  }, []);

  const productModalRef = useRef(null);
  const productModalInstance = useRef(null);
  const [modalMode, setModalMode] = useState(null);

  const removeProductModalRef = useRef(null);
  const removeProductModalInstance = useRef(null);

  useEffect(() => {
    productModalInstance.current = new Modal(productModalRef.current, {
      backdrop: false,
    });
    removeProductModalInstance.current = new Modal(
      removeProductModalRef.current,
      {
        backdrop: false,
      }
    );
  }, []);

  const handleOpenProductModal = (mode, product) => {
    setModalMode(mode);

    switch (mode) {
      case "edit":
        setTempProduct(product);
        break;
      case "create":
        setTempProduct(defaultModalState);
        break;
      default:
        break;
    }
    productModalInstance.current.show();
  };

  const handleCloseProductModal = () => {
    productModalInstance.current.hide();
    setInputErrors({});
  };

  const handleOpenRemoveModal = (product) => {
    removeProductModalInstance.current.show();
    setTempProduct(product);
  };

  const handleCloseRemoveModal = () => {
    removeProductModalInstance.current.hide();
  };

  const defaultModalState = {
    imageUrl: "",
    title: "",
    category: "",
    unit: "",
    origin_price: "",
    price: "",
    description: "",
    content: "",
    is_enabled: 0,
    imagesUrl: [""],
  };

  const [tempProduct, setTempProduct] = useState(defaultModalState);

  const handleProductInputChange = (e) => {
    const { value, name, type, checked } = e.target;

    setTempProduct({
      ...tempProduct,
      [name]: type === "checkbox" ? checked : value,
    });

    if (inputErrors[name]) {
      setInputErrors({
        ...inputErrors,
        [name]: "",
      });
    }
  };

  const handleImageChange = (e, index) => {
    const { value } = e.target;
    const newImages = [...tempProduct.imagesUrl];

    newImages[index] = value;

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages,
    });
  };

  const handleAddImage = () => {
    const newImages = [...tempProduct.imagesUrl, ""];

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages,
    });
  };

  const handleRemoveImage = () => {
    const newImages = [...tempProduct.imagesUrl];
    newImages.pop();

    setTempProduct({
      ...tempProduct,
      imagesUrl: newImages,
    });
  };

  const createProduct = async () => {
    const data = {
      data: {
        ...tempProduct,
        origin_price: Number(tempProduct.origin_price),
        price: Number(tempProduct.price),
        is_enabled: tempProduct.is_enabled ? 1 : 0,
      },
    };

    try {
      await axios.post(`${BASE_URL}/v2/api/${API_PATH}/admin/product`, data);
    } catch (error) {
      console.error(error);
    }
  };

  const editProduct = async () => {
    const productId = tempProduct.id;
    const data = {
      data: {
        ...tempProduct,
        origin_price: Number(tempProduct.origin_price),
        price: Number(tempProduct.price),
        is_enabled: tempProduct.is_enabled ? 1 : 0,
      },
    };

    try {
      await axios.put(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${productId}`,
        data
      );
    } catch (error) {
      console.error(error);
    }
  };

  const [inputErrors, setInputErrors] = useState({});

  const validUpdateProduct = () => {
    let isValid = true;
    let newErrors = {};

    if (!tempProduct.imageUrl.trim()) {
      newErrors.imageUrl = "請輸入主圖網址";
      isValid = false;
    }
    if (!tempProduct.title.trim()) {
      newErrors.title = "請輸入標題";
      isValid = false;
    }
    if (!tempProduct.category.trim()) {
      newErrors.category = "請輸入分類";
      isValid = false;
    }
    if (!tempProduct.unit.trim()) {
      newErrors.unit = "請輸入分類";
      isValid = false;
    }
    if (!tempProduct.origin_price.trim()) {
      newErrors.origin_price = "請輸入原價";
      isValid = false;
    }
    if (!tempProduct.price.trim()) {
      newErrors.price = "請輸入售價";
      isValid = false;
    }
    if (!tempProduct.description.trim()) {
      newErrors.description = "請輸入產品描述";
      isValid = false;
    }
    if (!tempProduct.content.trim()) {
      newErrors.content = "請輸入說明內容";
      isValid = false;
    }

    setInputErrors(newErrors);
    return isValid;
  };

  const handleUpdateProduct = async () => {
    const apiCall = modalMode === "edit" ? editProduct : createProduct;

    if (validUpdateProduct()) {
      try {
        await apiCall();
        getProducts();
        handleCloseProductModal();
      } catch (error) {
        alert("更新產品失敗");
      }
    }
  };

  const handleRemoveProduct = async () => {
    const productId = tempProduct.id;

    try {
      await axios.delete(
        `${BASE_URL}/v2/api/${API_PATH}/admin/product/${productId}`
      );
      getProducts();
      handleCloseRemoveModal();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      {isAuth ? (
        <div className="container py-5">
          <div className="row">
            <div className="col">
              <div className="d-flex justify-content-between">
                <h2>產品列表</h2>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenProductModal("create");
                  }}
                  className="btn btn-primary"
                >
                  建立新的產品
                </button>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">產品名稱</th>
                    <th scope="col">原價</th>
                    <th scope="col">售價</th>
                    <th scope="col">是否啟用</th>
                    <th scope="col">查看細節</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <th scope="row">{product.title}</th>
                      <td>{product.origin_price}</td>
                      <td>{product.price}</td>
                      <td>
                        {product.is_enabled ? (
                          <div className="text-success">啟用</div>
                        ) : (
                          "關閉"
                        )}
                      </td>
                      <td>
                        <div className="btn-group">
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenProductModal("edit", product);
                            }}
                            className="btn btn-outline-primary btn-sm"
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleOpenRemoveModal(product);
                            }}
                            className="btn btn-outline-danger btn-sm"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="d-flex flex-column justify-content-center align-items-center vh-100">
          <h1 className="mb-5">請先登入</h1>
          <form onSubmit={handleLogin} className="d-flex flex-column gap-3">
            <div className="form-floating mb-3">
              <input
                name="username"
                value={account.username}
                onChange={handleLoginInputChange}
                type="email"
                className={`form-control ${
                  inputErrors.title ? "is-invalid" : ""
                }`}
                id="username"
                placeholder="name@example.com"
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                name="password"
                value={account.password}
                onChange={handleLoginInputChange}
                type="password"
                className={`form-control ${
                  inputErrors.title ? "is-invalid" : ""
                }`}
                id="password"
                placeholder="Password"
              />
              <label htmlFor="password">Password</label>
            </div>
            <button className="btn btn-primary">登入</button>
          </form>
          <p className="mt-5 mb-3 text-muted">&copy; 2024~∞ - 六角學院</p>
        </div>
      )}
      <div
        id="productModal"
        className="modal"
        ref={productModalRef}
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content border-0 shadow">
            <div className="modal-header border-bottom">
              <h5 className="modal-title fs-4">
                {modalMode === "edit" ? "編輯產品" : "新增產品"}
              </h5>
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="btn-close"
                aria-label="Close"
              ></button>
            </div>

            <div className="modal-body p-4">
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="mb-4">
                    <label htmlFor="primary-image" className="form-label">
                      主圖
                    </label>
                    <div className="input-group has-validation">
                      <input
                        required
                        name="imageUrl"
                        type="text"
                        value={tempProduct.imageUrl}
                        onChange={handleProductInputChange}
                        id="primary-image"
                        className={`form-control ${
                          inputErrors.imageUrl ? "is-invalid" : ""
                        }`}
                        placeholder="請輸入圖片連結"
                      />
                      <div className="invalid-feedback">
                        {inputErrors.imageUrl}
                      </div>
                    </div>
                    <img
                      src={tempProduct.imageUrl}
                      alt={tempProduct.title}
                      className="img-fluid"
                    />
                  </div>

                  {/* 副圖 */}
                  <div className="border border-2 border-dashed rounded-3 p-3">
                    {tempProduct.imagesUrl?.map((image, index) => (
                      <div key={index} className="mb-2">
                        <label
                          htmlFor={`imagesUrl-${index + 1}`}
                          className="form-label"
                        >
                          副圖 {index + 1}
                        </label>
                        <input
                          id={`imagesUrl-${index + 1}`}
                          type="text"
                          value={image}
                          onChange={(e) => {
                            handleImageChange(e, index);
                          }}
                          placeholder={`圖片網址 ${index + 1}`}
                          className="form-control mb-2"
                        />
                        {image && (
                          <img
                            src={image}
                            alt={`副圖 ${index + 1}`}
                            className="img-fluid mb-2"
                          />
                        )}
                      </div>
                    ))}
                    <div className="btn-group w-100">
                      {tempProduct.imagesUrl.length < 5 &&
                        tempProduct.imagesUrl[
                          tempProduct.imagesUrl.length - 1
                        ] !== "" && (
                          <button
                            onClick={handleAddImage}
                            className="btn btn-outline-primary btn-sm w-100"
                          >
                            新增圖片
                          </button>
                        )}

                      {tempProduct.imagesUrl.length > 1 && (
                        <button
                          onClick={handleRemoveImage}
                          className="btn btn-outline-danger btn-sm w-100"
                        >
                          取消圖片
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-8">
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">
                      標題
                    </label>
                    <input
                      name="title"
                      id="title"
                      type="text"
                      value={tempProduct.title}
                      onChange={handleProductInputChange}
                      className={`form-control ${
                        inputErrors.title ? "is-invalid" : ""
                      }`}
                      placeholder="請輸入標題"
                    />
                    <div className="invalid-feedback">{inputErrors.title}</div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="category" className="form-label">
                      分類
                    </label>
                    <input
                      name="category"
                      id="category"
                      type="text"
                      value={tempProduct.category}
                      onChange={handleProductInputChange}
                      className={`form-control ${
                        inputErrors.category ? "is-invalid" : ""
                      }`}
                      placeholder="請輸入分類"
                    />
                    <div className="invalid-feedback">
                      {inputErrors.category}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="unit" className="form-label">
                      單位
                    </label>
                    <input
                      name="unit"
                      id="unit"
                      type="text"
                      value={tempProduct.unit}
                      onChange={handleProductInputChange}
                      className={`form-control ${
                        inputErrors.unit ? "is-invalid" : ""
                      }`}
                      placeholder="請輸入單位"
                    />
                    <div className="invalid-feedback">{inputErrors.unit}</div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label htmlFor="origin_price" className="form-label">
                        原價
                      </label>
                      <input
                        name="origin_price"
                        id="origin_price"
                        type="number"
                        value={tempProduct.origin_price}
                        onChange={handleProductInputChange}
                        className={`form-control ${
                          inputErrors.origin_price ? "is-invalid" : ""
                        }`}
                        placeholder="請輸入原價"
                      />
                      <div className="invalid-feedback">
                        {inputErrors.origin_price}
                      </div>
                    </div>
                    <div className="col-6">
                      <label htmlFor="price" className="form-label">
                        售價
                      </label>
                      <input
                        name="price"
                        id="price"
                        type="number"
                        value={tempProduct.price}
                        onChange={handleProductInputChange}
                        className={`form-control ${
                          inputErrors.price ? "is-invalid" : ""
                        }`}
                        placeholder="請輸入售價"
                      />
                      <div className="invalid-feedback">
                        {inputErrors.price}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">
                      產品描述
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      value={tempProduct.description}
                      onChange={handleProductInputChange}
                      className={`form-control ${
                        inputErrors.description ? "is-invalid" : ""
                      }`}
                      rows={4}
                      placeholder="請輸入產品描述"
                    ></textarea>
                    <div className="invalid-feedback">
                      {inputErrors.description}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="content" className="form-label">
                      說明內容
                    </label>
                    <textarea
                      name="content"
                      id="content"
                      value={tempProduct.content}
                      onChange={handleProductInputChange}
                      className={`form-control ${
                        inputErrors.content ? "is-invalid" : ""
                      }`}
                      rows={4}
                      placeholder="請輸入說明內容"
                    ></textarea>
                    <div className="invalid-feedback">
                      {inputErrors.content}
                    </div>
                  </div>

                  <div className="form-check">
                    <input
                      name="is_enabled"
                      type="checkbox"
                      checked={tempProduct.is_enabled}
                      onChange={handleProductInputChange}
                      className="form-check-input"
                      id="isEnabled"
                    />
                    <label className="form-check-label" htmlFor="isEnabled">
                      是否啟用
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button
                type="button"
                onClick={handleCloseProductModal}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleUpdateProduct}
                className="btn btn-primary"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="delProductModal"
        ref={removeProductModalRef}
        tabIndex="-1"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5">刪除產品</h1>
              <button
                type="button"
                onClick={handleCloseRemoveModal}
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              你是否要刪除
              <span className="text-danger fw-bold">{tempProduct.title}</span>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                onClick={handleCloseRemoveModal}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleRemoveProduct}
                className="btn btn-danger"
              >
                刪除
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
