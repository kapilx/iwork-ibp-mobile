import downloadIcon from "../../assets/svgs/download-icon.svg";
import { StyledButton, ButtonText } from "./styles";
import { ERROR_FILE } from "../../constants";

interface ActionButtonProps {
  errorFileSize?: string;
  onClick?: () => void;
  disabled?: boolean;
  buttonText?: string;
  imageSrc?: string;
  customStyles?: React.CSSProperties;
  imageStyles?: React.CSSProperties;
  isIconVisible?: boolean;
}

const ActionButton = ({
  errorFileSize,
  onClick,
  disabled = false,
  buttonText = ERROR_FILE,
  imageSrc = downloadIcon,
  customStyles,
  imageStyles,
  isIconVisible = true,
}: ActionButtonProps) => {
  return (
    <StyledButton
      variantType="secondary"
      onClick={onClick}
      disabled={disabled}
      customStyles={customStyles}
    >
      {isIconVisible && (
        <img src={imageSrc} alt="action-icon" style={imageStyles} />
      )}
      <ButtonText>
        {errorFileSize ? `${buttonText} (${errorFileSize})` : buttonText}
      </ButtonText>
    </StyledButton>
  );
};

export default ActionButton;
