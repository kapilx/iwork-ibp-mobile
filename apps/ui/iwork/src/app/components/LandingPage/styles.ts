import { styled } from "@mui/material";

export const LandingPageContainer = styled("div")`
  position: relative;
  min-height: calc(100vh - 52px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
`;

export const ButtonContainer = styled("div")`
  position: absolute;
  top: 10px;
  right: 20px;
`;

export const Button = styled("button")`
  margin-left: 10px;
  padding: 10px 16px;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:first-child {
    background-color: #007bff;
    color: white;
  }

  &:first-child:hover {
    background-color: #0056b3;
  }

  &:last-child {
    background-color: #28a745;
    color: white;
  }

  &:last-child:hover {
    background-color: #1e7e34;
  }
`;

export const Title = styled("h1")`
  font-size: 2rem;
  font-weight: bold;
`;
