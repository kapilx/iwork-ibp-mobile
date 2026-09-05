import { useParams } from "react-router-dom";
import AssetDataTable from "./assetDataTable";
import { MainContainer } from "./styles";
import SubAssetDataTable from "./subAssetDataTable";

const AssetInsured = () => {
  const { id } = useParams();
  return (
    <>
      <MainContainer>
        <AssetDataTable policyId={id} />
        <SubAssetDataTable policyId={id} />
      </MainContainer>
    </>
  );
};

export default AssetInsured;
