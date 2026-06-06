import { GMContainer } from "@/components/GMContainer";
import { GMText } from "@/components/GMText";
import { type Word } from "@/data/words";

function WordCard({ word }: { word: Word }): React.JSX.Element {
  return (
    <GMContainer variant="card" gap="sm" px="sm" py="sm" fullHeight>
      <GMContainer>
        <span className="zh-characters">{word.chinese}</span>
        <GMText variant="title" color="brand">
          {word.pinyin}
        </GMText>
      </GMContainer>
      <GMContainer>
        <GMText>{`[${(word.sino_vi ?? "—").toUpperCase()}]`}</GMText>
        <GMText truncate>{word.vi}</GMText>
      </GMContainer>
      <GMContainer>
        <GMText>{`[${word.types.join(", ")}]`}</GMText>
        <GMText truncate>{word.en}</GMText>
      </GMContainer>
    </GMContainer>
  );
}

export { WordCard };
