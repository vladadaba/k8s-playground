import { useKeycloak } from "@react-keycloak/web";
import axios from "axios";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

const AdminPanel = () => {
  const { keycloak } = useKeycloak();
  const [pendingOrders, setPendingOrders] = useState([] as Order[]);

  const fetchOrders = async () => {
    const { data: orders } = await axios.get<Order[]>(
      "http://192.168.105.2:30894/app1/orders",
      {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      }
    );
    setPendingOrders(orders);
  };

  useEffect(() => {
    fetchOrders().catch();
  }, []);

  const approve = async (orderId: string, isApproved: boolean) => {
    await axios
      .post(
        "http://192.168.105.2:30894/app1/approve-order",
        {
          orderId,
          isApproved,
        },
        {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        }
      )
      .then(fetchOrders);
  };

  return (
    <ul>
      {pendingOrders.map((order) => (
        <li>
          {order.name}, {order.quantity}, {order.total}
          <button onClick={() => approve(order.id, true)}>Approve</button>
          <button onClick={() => approve(order.id, false)}>Reject</button>
        </li>
      ))}
    </ul>
  );
};

export default AdminPanel;
