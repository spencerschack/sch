class TokenRequestResource < JSONAPI::Resource

  attributes :temporary_token, :persistent_token

  primary_key :temporary_token

end
