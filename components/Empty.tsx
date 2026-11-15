import { Icon } from "./Icon";

interface EmptyProps {
  title: string;
  text: string;
  /** O texto do botão, se o estado vazio tiver uma ação. */
  action?: string;
  onClick?: () => void;
}

export function Empty({ title, text, action, onClick }: EmptyProps) {
  return (
    <div className="empty-state">
      <Icon name="search_off" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="button button-primary" onClick={onClick}>
          {action} <Icon name="arrow_forward" className="button-icon" />
        </button>
      )}
    </div>
  );
}
