import axios from 'axios';

async function test() {
  try {
    const login = await axios.post('http://localhost:8080/api/v1/auth/login', {
      email: 'admin@handmade.com',
      password: 'admin123'
    });
    const token = login.data.token;
    
    console.log("Token:", token.substring(0, 20) + "...");
    
    const res = await axios.post('http://localhost:8080/api/v1/categories', {
      name: 'Test Category ' + Date.now(),
      description: null,
      imageUrl: null,
      parentId: null
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Category created:", res.data);
  } catch (e) {
    console.error("Error creating category:", e.response ? e.response.data : e.message);
  }
}
test();
