interface NavHeaderProps {
    leftText?: string;
    leftOnClick?: () => void;
    leftHoverText?: string;
    centerText?: string;
    centerOnClick?: () => void;
    centerHoverText?: string;
    rightText?: string;
    rightOnClick?: () => void;
    rightHoverText?: string;
}

const getHeaderSpan = ({ text, onClick, hoverText, isCenter = false }: { text?: string; onClick?: () => void; hoverText?: string; isCenter?: boolean }): React.ReactNode => {
    if (!text) {
        return <span />;
    }
    const classes = isCenter ? ['title'] : [];
    if (onClick) {
        classes.push('clickable-text');
    }
    return (
        <span className={classes.join(' ')} onClick={onClick} title={hoverText}>
            {text}
        </span>
    );
};

export const NavHeader: React.FC<NavHeaderProps> = ({
    leftText,
    leftOnClick,
    leftHoverText,
    centerText,
    centerOnClick,
    centerHoverText,
    rightText,
    rightOnClick,
    rightHoverText,
}: NavHeaderProps): React.ReactNode => {
    return (
        <div className="nav-header">
            {getHeaderSpan({ text: leftText, onClick: leftOnClick, hoverText: leftHoverText })}
            {getHeaderSpan({ text: centerText, onClick: centerOnClick, hoverText: centerHoverText, isCenter: true })}
            {getHeaderSpan({ text: rightText, onClick: rightOnClick, hoverText: rightHoverText })}
        </div>
    );
};
