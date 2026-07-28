import { jsxs as _jsxs } from "react/jsx-runtime";
/** 名簿の氏名に混ざる全角スペース・連続空白を、表示用に1つの半角スペースへ詰める。 */
export function compactPersonName(name) {
    return name.replace(/[　\s]+/g, ' ').trim();
}
export function NameWithRoom({ name, room, roomPrefix, className, suffix }) {
    return (_jsxs("span", { className: `magi-name-room${className ? ` ${className}` : ''}`, children: [_jsxs("span", { className: "magi-name-room-name", children: [compactPersonName(name), suffix] }), room ? (_jsxs("span", { className: "magi-name-room-badge", title: `居室 ${room}`, children: [roomPrefix ? `${roomPrefix} ` : '', room] })) : null] }));
}
//# sourceMappingURL=NameWithRoom.js.map