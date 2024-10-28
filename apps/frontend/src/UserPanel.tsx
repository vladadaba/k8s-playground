import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  quantity: number;
  cost: number;
}

const UserPanel = () => {
  const { keycloak } = useKeycloak();
  const [products, setProducts] = useState([] as Product[]);

  const fetchProducts = async () => {
    const { data: products } = await axios.get<Product[]>(
      "http://myapp.localhost/app1/products",
      {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      }
    );

    setProducts(products.sort((a, b) => a.id.localeCompare(b.id)));
  };

  useEffect(() => {
    fetchProducts().catch();
  }, []);

  const purchase = async (productId: string, quantity: number) => {
    await axios.post(
      "http://myapp.localhost/app1/purchase",
      {
        productId,
        quantity,
      },
      {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      }
    );
  };

  return (
    <div>
      <button onClick={fetchProducts}>Refresh</button>
      <ul>
        {products.map((product) => (
          <li>
            {product.name}, {product.quantity}, {product.cost}
            <button onClick={() => purchase(product.id, 1)}>Purchase 1</button>
            <button onClick={() => purchase(product.id, 10)}>
              Purchase 10
            </button>
            <button onClick={() => purchase(product.id, 100)}>
              Purchase 100
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserPanel;
