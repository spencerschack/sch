class LoginRequestResource < JSONAPI::Resource

  attribute :email

  primary_key :email

end
