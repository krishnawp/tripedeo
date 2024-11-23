const axios = require('axios');

exports.handler = async (event, context) => {
  // Headers for JSON response
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    // Webflow API Bearer token and IDs
    const bearer = '6b1b57fee1c903805b03254969117ce94cb5c0957ab673e85aa98d135f86356e';
    const collectionIdRegions = '64a7a5ea3320eb79ffc5ddc2';
    const collectionIdCountries = '64a7a5ea3320eb79ffc5de5a';
    const siteUrl = 'https://de.tripedeo.com';
    const countriesSlug = `${siteUrl}/countries/`;

    // Fetch regions and countries data from Webflow API
    const responseRegions = await axios.get(
      `https://api.webflow.com/collections/${collectionIdRegions}/items`,
      {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${bearer}`,
        },
      }
    );

    const responseCountries = await axios.get(
      `https://api.webflow.com/collections/${collectionIdCountries}/items`,
      {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${bearer}`,
        },
      }
    );

    // Parse responses
    const allRegions = responseRegions.data.items;
    const allCountries = responseCountries.data.items;

    // Map countries to create an ID-based lookup
    const myCountries = {};
    allCountries.forEach((country) => {
      myCountries[country._id] = {
        name: country.name,
        slug: `${countriesSlug}${country.slug}`,
        flag: country.flag?.url || '',
      };
    });

    // Map regions and associate countries
    const myRegions = {};
    allRegions.forEach((region) => {
      if (region['travel-countries'] && region['travel-countries'].length > 0) {
        const tempCountries = region['travel-countries']
          .map((countryId) => myCountries[countryId])
          .filter(Boolean); // Remove undefined entries

        // Sort alphabetically by country name
        tempCountries.sort((a, b) => a.name.localeCompare(b.name));

        myRegions[`${region['region-unique-id']}--${region.name}`] = tempCountries;
      } else {
        myRegions[`${region['region-unique-id']}--${region.name}`] = null;
      }
    });

    // Return the response as JSON
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(myRegions),
    };
  } catch (error) {
    // Handle errors
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'An error occurred', details: error.message }),
    };
  }
};
  