import axios from "axios";

const Adminurl = "http://localhost:8081";

const ExcelService = {
  getExcel: async () => {
    const response = await axios.get(Adminurl + "/get");
    return response.data;
  },
  postExcel: async (data) => {
    const response = await axios.post(Adminurl + "/saveAll", data);
    return response.data;
  },
  getAllFiles: async () => {
    const response = await axios.get(Adminurl + "/getAllFiles");
    return response.data;
  },
  getminmaxtenor: async () => {
    const response = await axios.get(Adminurl + "/getminmaxtennor");
    return response.data;
  },
};

export default ExcelService;