export const Footer = () => {
  return (
    <>
      <div className="mx-auto w-full px-8 md:px-12 max-w-7xl flex justify-center items-center">
        <div className="mt-20 mb-10 text-[#555] flex sm:flex-nowrap w-full text-[12px] sm:text-[16px] justify-center">
          <div className="sm:pr-3 pr-2">
            <a href="/imprint">Imprint</a>
          </div>
          <div className="sm:pr-3 sm:pl-3 pr-2 pl-2">
            <a href="/data-privacy">Data Privacy</a>
          </div>
          <div className="sm:pl-3 pl-2">
            <a href="/terms-of-service">Terms of Service</a>
          </div>
        </div>
      </div>
    </>
  );
};
