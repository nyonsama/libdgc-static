import { FC, ReactNode } from "react";
import { compressibleRegexpString } from "../utils";

const compressRegexp = new RegExp(compressibleRegexpString);

export interface CompressPunctuationProps {
  text: string;
}
const CompressPunctuation: FC<CompressPunctuationProps> = ({ text }) => {
  const result: ReactNode[] = [];
  let textIndex = 0;
  while (true) {
    const tail = text.slice(textIndex);
    const match = tail.match(compressRegexp);
    if (!match) {
      result.push(tail);
      break;
    }
    if (match.index! > 0) {
      result.push(tail.slice(0, match.index!));
      textIndex += match.index!;
    }
    result.push(
      <span key={textIndex} className="compress">
        {match[0][0]}
      </span>,
    );
    textIndex += 1;
  }
  return result;
};
export default CompressPunctuation;
