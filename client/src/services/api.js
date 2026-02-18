    import axios from "axios";
    

    const API = axios.create({
      baseURL:  process.env.REACT_APP_API_URL
  // backend URL
    }); 

    // Add token automatically to all requests if it exists
    API.interceptors.request.use((req) => {
      const token = localStorage.getItem("token");
      if (token) {
        req.headers.Authorization = `Bearer ${token}`;
      }
      return req;
    });

    export default API;
