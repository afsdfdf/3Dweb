import { MediumActionButton, type MediumActionButtonProps } from "./medium-action-button";

const orangeMediumImages = {
  normal: "/ui-lab/formal-components/assets/buttons/button-orange-medium-normal.png",
  hover: "/ui-lab/formal-components/assets/buttons/button-orange-medium-hover.png",
  pressed: "/ui-lab/formal-components/assets/buttons/button-orange-medium-pressed.png",
};

type OrangeMediumActionButtonProps = Omit<MediumActionButtonProps, "imageSet">;

export function OrangeMediumActionButton(props: OrangeMediumActionButtonProps) {
  return <MediumActionButton {...props} imageSet={orangeMediumImages} />;
}
