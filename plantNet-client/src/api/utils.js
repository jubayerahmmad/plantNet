import axios from "axios";

// opload image and return img url
const imageUpload = async (image) => {
  const formData = new FormData();
  formData.append("image", image); // key must be "image"

  //send data to imgbb
  const { data } = await axios.post(
    `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMGBB_API_KEY}`,
    formData
  );
  const image_url = data.data.display_url;
  //   console.log(image_url);
  return image_url;
};

export default imageUpload;
