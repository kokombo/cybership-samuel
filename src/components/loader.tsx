import React from "react";
import { ColorRing } from "react-loader-spinner";

type LoaderProps = {
  height: string;
  width: string;
};

const Loader = ({ height, width }: LoaderProps) => {
  return (
    <ColorRing
      visible={true}
      height={height}
      width={width}
      ariaLabel="loading"
      colors={["#e15b64", "#f47e60", "#f8b26a", "#abbd81", "#849b87"]}
    />
  );
};

export default Loader;
