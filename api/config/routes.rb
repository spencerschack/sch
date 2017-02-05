Rails.application.routes.draw do

  resources :tasks, only: [:create] do
    put :finish, on: :member, via: :put
  end

  root to: 'ui#index'

end
