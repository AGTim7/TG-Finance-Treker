declare global{
  interface Window{
    Telegram?:{
      WebApp?:{
        ready(): void
      }
    }
  }
}

export{}