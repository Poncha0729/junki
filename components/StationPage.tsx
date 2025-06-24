type Station = {
    name: string;
    // 必要に応じて他のプロパティも追加してください
    // e.g. description?: string;
  };
  
  type StationPageProps = {
    station: Station;
  };
  
  const StationPage = ({ station }: StationPageProps) => {
    return (
      <div>
        <h1>{station.name}</h1>
        {/* 他の情報があればここに追加 */}
      </div>
    );
  };
  
  export default StationPage;
  